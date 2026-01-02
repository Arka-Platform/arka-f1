package com.arka.modules.trustscore.service;

import com.arka.modules.trustscore.dto.TrustScoreResponse;
import com.arka.modules.trustscore.entity.TrustScoreEntity;
import com.arka.modules.trustscore.repository.TrustScoreRepository;
import com.arka.modules.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for calculating and managing user trust scores.
 * 
 * Trust Score Calculation (0-100):
 * - Condition Accuracy (30%): How accurately sellers describe book condition
 * - Show Up Reliability (30%): Show ups vs no shows (after 3 pickup trials)
 * - Response Time (20%): Average response time to book requests
 * - Completion Rate (15%): Percentage of transactions completed
 * - Cancellation Rate (5%): Lower is better (penalty for cancellations)
 */
@Service
public class TrustScoreService {
  private static final BigDecimal CONDITION_ACCURACY_WEIGHT = new BigDecimal("0.30");
  private static final BigDecimal SHOWUP_RELIABILITY_WEIGHT = new BigDecimal("0.30");
  private static final BigDecimal RESPONSE_TIME_WEIGHT = new BigDecimal("0.20");
  private static final BigDecimal COMPLETION_RATE_WEIGHT = new BigDecimal("0.15");
  private static final BigDecimal CANCELLATION_RATE_WEIGHT = new BigDecimal("0.05");
  
  // Response time thresholds (in hours)
  private static final BigDecimal EXCELLENT_RESPONSE_TIME = new BigDecimal("1"); // < 1 hour = 100
  private static final BigDecimal GOOD_RESPONSE_TIME = new BigDecimal("6"); // < 6 hours = 80
  private static final BigDecimal AVERAGE_RESPONSE_TIME = new BigDecimal("24"); // < 24 hours = 60
  private static final BigDecimal POOR_RESPONSE_TIME = new BigDecimal("48"); // < 48 hours = 40
  
  private final TrustScoreRepository trustScoreRepository;
  private final UserRepository userRepository;

  public TrustScoreService(TrustScoreRepository trustScoreRepository, UserRepository userRepository) {
    this.trustScoreRepository = trustScoreRepository;
    this.userRepository = userRepository;
  }

  /**
   * Get or create trust score for a user
   */
  public TrustScoreEntity getOrCreateTrustScore(UUID userId) {
    // First verify user exists
    if (!userRepository.existsById(userId)) {
      throw new IllegalArgumentException("User not found with ID: " + userId);
    }
    
    return trustScoreRepository.findByUserId(userId)
        .orElseGet(() -> {
          TrustScoreEntity entity = new TrustScoreEntity(userId);
          return trustScoreRepository.save(entity);
        });
  }

  /**
   * Get trust score response for a user
   */
  public TrustScoreResponse getTrustScore(UUID userId) {
    TrustScoreEntity entity = getOrCreateTrustScore(userId);
    return toResponse(entity);
  }

  /**
   * Record a condition assessment (when buyer receives book)
   * @param sellerId The seller who listed the book
   * @param listedCondition The condition the seller listed
   * @param actualCondition The actual condition when received
   * @return true if condition matches, false otherwise
   */
  @Transactional
  public boolean recordConditionAssessment(UUID sellerId, String listedCondition, String actualCondition) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(sellerId);
    
    trustScore.setConditionAssessmentsCount(trustScore.getConditionAssessmentsCount() + 1);
    
    boolean isAccurate = normalizeCondition(listedCondition).equals(normalizeCondition(actualCondition));
    if (isAccurate) {
      trustScore.setAccurateConditionCount(trustScore.getAccurateConditionCount() + 1);
    }
    
    // Recalculate condition accuracy score
    recalculateConditionAccuracy(trustScore);
    recalculateOverallTrustScore(trustScore);
    
    trustScoreRepository.save(trustScore);
    return isAccurate;
  }

  /**
   * Record a pickup commitment (when user commits to share/lend a book)
   */
  @Transactional
  public void recordPickupCommitment(UUID userId) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(userId);
    trustScore.setPickupCommitmentsCount(trustScore.getPickupCommitmentsCount() + 1);
    trustScoreRepository.save(trustScore);
  }

  /**
   * Record a successful show up
   */
  @Transactional
  public void recordSuccessfulShowup(UUID userId) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(userId);
    trustScore.setSuccessfulShowupsCount(trustScore.getSuccessfulShowupsCount() + 1);
    recalculateShowupReliability(trustScore);
    recalculateOverallTrustScore(trustScore);
    trustScoreRepository.save(trustScore);
  }

  /**
   * Record a no show (after 3 pickup trials)
   */
  @Transactional
  public void recordNoShow(UUID userId) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(userId);
    trustScore.setNoShowsCount(trustScore.getNoShowsCount() + 1);
    recalculateShowupReliability(trustScore);
    recalculateOverallTrustScore(trustScore);
    trustScoreRepository.save(trustScore);
  }

  /**
   * Record response time to a book request
   * @param userId The user who responded
   * @param requestCreatedAt When the request was created
   * @param responseTime When the user responded
   */
  @Transactional
  public void recordResponseTime(UUID userId, Instant requestCreatedAt, Instant responseTime) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(userId);
    
    long hours = java.time.Duration.between(requestCreatedAt, responseTime).toHours();
    BigDecimal responseTimeHours = BigDecimal.valueOf(hours);
    
    // Update average response time
    int count = trustScore.getRequestsRespondedCount();
    BigDecimal currentAverage = trustScore.getAverageResponseTimeHours();
    
    if (count == 0) {
      trustScore.setAverageResponseTimeHours(responseTimeHours);
    } else {
      // Moving average: (current * count + new) / (count + 1)
      BigDecimal newAverage = currentAverage
          .multiply(BigDecimal.valueOf(count))
          .add(responseTimeHours)
          .divide(BigDecimal.valueOf(count + 1), 2, RoundingMode.HALF_UP);
      trustScore.setAverageResponseTimeHours(newAverage);
    }
    
    trustScore.setRequestsRespondedCount(count + 1);
    
    // Recalculate response time score
    recalculateResponseTimeScore(trustScore);
    recalculateOverallTrustScore(trustScore);
    
    trustScoreRepository.save(trustScore);
  }

  /**
   * Record transaction completion
   */
  @Transactional
  public void recordTransactionCompletion(UUID userId) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(userId);
    trustScore.setTotalTransactions(trustScore.getTotalTransactions() + 1);
    trustScore.setCompletedTransactions(trustScore.getCompletedTransactions() + 1);
    recalculateCompletionRate(trustScore);
    recalculateOverallTrustScore(trustScore);
    trustScoreRepository.save(trustScore);
  }

  /**
   * Record transaction cancellation
   */
  @Transactional
  public void recordTransactionCancellation(UUID userId) {
    TrustScoreEntity trustScore = getOrCreateTrustScore(userId);
    trustScore.setTotalTransactions(trustScore.getTotalTransactions() + 1);
    trustScore.setCancelledTransactions(trustScore.getCancelledTransactions() + 1);
    recalculateCancellationRate(trustScore);
    recalculateCompletionRate(trustScore);
    recalculateOverallTrustScore(trustScore);
    trustScoreRepository.save(trustScore);
  }

  /**
   * Recalculate condition accuracy score
   */
  private void recalculateConditionAccuracy(TrustScoreEntity trustScore) {
    int total = trustScore.getConditionAssessmentsCount();
    if (total == 0) {
      trustScore.setConditionAccuracyScore(BigDecimal.ZERO);
      return;
    }
    
    int accurate = trustScore.getAccurateConditionCount();
    BigDecimal accuracy = BigDecimal.valueOf(accurate)
        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));
    
    trustScore.setConditionAccuracyScore(accuracy);
  }

  /**
   * Recalculate show up reliability score
   */
  private void recalculateShowupReliability(TrustScoreEntity trustScore) {
    int total = trustScore.getPickupCommitmentsCount();
    if (total == 0) {
      trustScore.setShowupReliabilityScore(BigDecimal.ZERO);
      return;
    }
    
    int successful = trustScore.getSuccessfulShowupsCount();
    int noShows = trustScore.getNoShowsCount();
    
    // Calculate score: (successful - noShows * 2) / total * 100
    // No shows are penalized more heavily
    BigDecimal score = BigDecimal.valueOf(successful)
        .subtract(BigDecimal.valueOf(noShows).multiply(BigDecimal.valueOf(2)))
        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));
    
    // Ensure score is between 0 and 100
    if (score.compareTo(BigDecimal.ZERO) < 0) {
      score = BigDecimal.ZERO;
    } else if (score.compareTo(BigDecimal.valueOf(100)) > 0) {
      score = BigDecimal.valueOf(100);
    }
    
    trustScore.setShowupReliabilityScore(score);
  }

  /**
   * Recalculate response time score based on average response time
   */
  private void recalculateResponseTimeScore(TrustScoreEntity trustScore) {
    BigDecimal avgHours = trustScore.getAverageResponseTimeHours();
    
    if (avgHours.compareTo(BigDecimal.ZERO) == 0) {
      trustScore.setResponseTimeScore(BigDecimal.ZERO);
      return;
    }
    
    BigDecimal score;
    if (avgHours.compareTo(EXCELLENT_RESPONSE_TIME) <= 0) {
      score = BigDecimal.valueOf(100);
    } else if (avgHours.compareTo(GOOD_RESPONSE_TIME) <= 0) {
      // Linear interpolation between 1-6 hours: 100 to 80
      score = BigDecimal.valueOf(100)
          .subtract(avgHours.subtract(EXCELLENT_RESPONSE_TIME)
              .divide(GOOD_RESPONSE_TIME.subtract(EXCELLENT_RESPONSE_TIME), 2, RoundingMode.HALF_UP)
              .multiply(BigDecimal.valueOf(20)));
    } else if (avgHours.compareTo(AVERAGE_RESPONSE_TIME) <= 0) {
      // Linear interpolation between 6-24 hours: 80 to 60
      score = BigDecimal.valueOf(80)
          .subtract(avgHours.subtract(GOOD_RESPONSE_TIME)
              .divide(AVERAGE_RESPONSE_TIME.subtract(GOOD_RESPONSE_TIME), 2, RoundingMode.HALF_UP)
              .multiply(BigDecimal.valueOf(20)));
    } else if (avgHours.compareTo(POOR_RESPONSE_TIME) <= 0) {
      // Linear interpolation between 24-48 hours: 60 to 40
      score = BigDecimal.valueOf(60)
          .subtract(avgHours.subtract(AVERAGE_RESPONSE_TIME)
              .divide(POOR_RESPONSE_TIME.subtract(AVERAGE_RESPONSE_TIME), 2, RoundingMode.HALF_UP)
              .multiply(BigDecimal.valueOf(20)));
    } else {
      // > 48 hours: 40 - (hours - 48) * 0.5, minimum 0
      score = BigDecimal.valueOf(40)
          .subtract(avgHours.subtract(POOR_RESPONSE_TIME)
              .multiply(new BigDecimal("0.5")));
      if (score.compareTo(BigDecimal.ZERO) < 0) {
        score = BigDecimal.ZERO;
      }
    }
    
    trustScore.setResponseTimeScore(score);
  }

  /**
   * Recalculate completion rate
   */
  private void recalculateCompletionRate(TrustScoreEntity trustScore) {
    int total = trustScore.getTotalTransactions();
    if (total == 0) {
      trustScore.setCompletionRate(BigDecimal.ZERO);
      return;
    }
    
    int completed = trustScore.getCompletedTransactions();
    BigDecimal rate = BigDecimal.valueOf(completed)
        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));
    
    trustScore.setCompletionRate(rate);
  }

  /**
   * Recalculate cancellation rate
   */
  private void recalculateCancellationRate(TrustScoreEntity trustScore) {
    int total = trustScore.getTotalTransactions();
    if (total == 0) {
      trustScore.setCancellationRate(BigDecimal.ZERO);
      return;
    }
    
    int cancelled = trustScore.getCancelledTransactions();
    BigDecimal rate = BigDecimal.valueOf(cancelled)
        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));
    
    trustScore.setCancellationRate(rate);
  }

  /**
   * Recalculate overall trust score
   */
  private void recalculateOverallTrustScore(TrustScoreEntity trustScore) {
    BigDecimal overallScore = BigDecimal.ZERO;
    
    // Condition accuracy (30%)
    overallScore = overallScore.add(
        trustScore.getConditionAccuracyScore().multiply(CONDITION_ACCURACY_WEIGHT));
    
    // Show up reliability (30%)
    overallScore = overallScore.add(
        trustScore.getShowupReliabilityScore().multiply(SHOWUP_RELIABILITY_WEIGHT));
    
    // Response time (20%)
    overallScore = overallScore.add(
        trustScore.getResponseTimeScore().multiply(RESPONSE_TIME_WEIGHT));
    
    // Completion rate (15%)
    overallScore = overallScore.add(
        trustScore.getCompletionRate().multiply(COMPLETION_RATE_WEIGHT));
    
    // Cancellation rate (5% - penalty, so subtract)
    BigDecimal cancellationPenalty = trustScore.getCancellationRate()
        .multiply(CANCELLATION_RATE_WEIGHT);
    overallScore = overallScore.subtract(cancellationPenalty);
    
    // Ensure score is between 0 and 100
    if (overallScore.compareTo(BigDecimal.ZERO) < 0) {
      overallScore = BigDecimal.ZERO;
    } else if (overallScore.compareTo(BigDecimal.valueOf(100)) > 0) {
      overallScore = BigDecimal.valueOf(100);
    }
    
    trustScore.setTrustScore(overallScore);
    trustScore.setLastCalculatedAt(Instant.now());
  }

  /**
   * Normalize condition string for comparison
   */
  private String normalizeCondition(String condition) {
    if (condition == null) {
      return "";
    }
    return condition.trim().toUpperCase()
        .replace(" ", "_")
        .replace("-", "_");
  }

  /**
   * Convert entity to response DTO
   */
  private TrustScoreResponse toResponse(TrustScoreEntity entity) {
    return new TrustScoreResponse(
        entity.getUserId(),
        entity.getTrustScore(),
        entity.getConditionAccuracyScore(),
        entity.getConditionAssessmentsCount(),
        entity.getAccurateConditionCount(),
        entity.getShowupReliabilityScore(),
        entity.getPickupCommitmentsCount(),
        entity.getSuccessfulShowupsCount(),
        entity.getNoShowsCount(),
        entity.getResponseTimeScore(),
        entity.getAverageResponseTimeHours(),
        entity.getRequestsRespondedCount(),
        entity.getCompletionRate(),
        entity.getTotalTransactions(),
        entity.getCompletedTransactions(),
        entity.getCancellationRate(),
        entity.getCancelledTransactions(),
        entity.getLastCalculatedAt()
    );
  }
}

