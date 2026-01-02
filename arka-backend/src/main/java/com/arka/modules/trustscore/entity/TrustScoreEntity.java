package com.arka.modules.trustscore.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity to store user trust scores and metrics.
 * Trust score is calculated based on:
 * - Book condition accuracy (what is said is what is)
 * - Show ups/no shows (after 3 pickup trials)
 * - Response time to book requests
 * - Transaction completion rate
 * - Cancellation rate
 */
@Entity
@Table(name = "trust_scores")
public class TrustScoreEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false, unique = true)
  private UUID userId;

  /**
   * Overall trust score (0-100)
   * Calculated as weighted average of all metrics
   */
  @Column(name = "trust_score", nullable = false, precision = 5, scale = 2)
  private BigDecimal trustScore = BigDecimal.ZERO;

  /**
   * Book condition accuracy score (0-100)
   * Based on how accurately sellers describe book condition
   */
  @Column(name = "condition_accuracy_score", precision = 5, scale = 2)
  private BigDecimal conditionAccuracyScore = BigDecimal.ZERO;

  /**
   * Total condition assessments (seller listed vs buyer received)
   */
  @Column(name = "condition_assessments_count")
  private Integer conditionAssessmentsCount = 0;

  /**
   * Number of accurate condition assessments
   */
  @Column(name = "accurate_condition_count")
  private Integer accurateConditionCount = 0;

  /**
   * Show up reliability score (0-100)
   * Based on show ups vs no shows (after 3 pickup trials)
   */
  @Column(name = "showup_reliability_score", precision = 5, scale = 2)
  private BigDecimal showupReliabilityScore = BigDecimal.ZERO;

  /**
   * Total pickup commitments (when user commits to share/lend)
   */
  @Column(name = "pickup_commitments_count")
  private Integer pickupCommitmentsCount = 0;

  /**
   * Number of successful show ups
   */
  @Column(name = "successful_showups_count")
  private Integer successfulShowupsCount = 0;

  /**
   * Number of no shows (after 3 pickup trials)
   */
  @Column(name = "no_shows_count")
  private Integer noShowsCount = 0;

  /**
   * Response time score (0-100)
   * Based on average response time to book requests
   */
  @Column(name = "response_time_score", precision = 5, scale = 2)
  private BigDecimal responseTimeScore = BigDecimal.ZERO;

  /**
   * Average response time in hours
   */
  @Column(name = "average_response_time_hours", precision = 10, scale = 2)
  private BigDecimal averageResponseTimeHours = BigDecimal.ZERO;

  /**
   * Total requests responded to
   */
  @Column(name = "requests_responded_count")
  private Integer requestsRespondedCount = 0;

  /**
   * Transaction completion rate (0-100)
   * Percentage of transactions completed successfully
   */
  @Column(name = "completion_rate", precision = 5, scale = 2)
  private BigDecimal completionRate = BigDecimal.ZERO;

  /**
   * Total transactions initiated
   */
  @Column(name = "total_transactions")
  private Integer totalTransactions = 0;

  /**
   * Number of completed transactions
   */
  @Column(name = "completed_transactions")
  private Integer completedTransactions = 0;

  /**
   * Cancellation rate (0-100)
   * Percentage of transactions cancelled
   */
  @Column(name = "cancellation_rate", precision = 5, scale = 2)
  private BigDecimal cancellationRate = BigDecimal.ZERO;

  /**
   * Number of cancelled transactions
   */
  @Column(name = "cancelled_transactions")
  private Integer cancelledTransactions = 0;

  /**
   * Last calculated timestamp
   */
  @Column(name = "last_calculated_at")
  private java.time.Instant lastCalculatedAt;

  protected TrustScoreEntity() {
    // JPA
  }

  public TrustScoreEntity(UUID userId) {
    this.userId = userId;
    this.lastCalculatedAt = java.time.Instant.now();
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public BigDecimal getTrustScore() {
    return trustScore;
  }

  public void setTrustScore(BigDecimal trustScore) {
    this.trustScore = trustScore;
  }

  public BigDecimal getConditionAccuracyScore() {
    return conditionAccuracyScore;
  }

  public void setConditionAccuracyScore(BigDecimal conditionAccuracyScore) {
    this.conditionAccuracyScore = conditionAccuracyScore;
  }

  public Integer getConditionAssessmentsCount() {
    return conditionAssessmentsCount;
  }

  public void setConditionAssessmentsCount(Integer conditionAssessmentsCount) {
    this.conditionAssessmentsCount = conditionAssessmentsCount;
  }

  public Integer getAccurateConditionCount() {
    return accurateConditionCount;
  }

  public void setAccurateConditionCount(Integer accurateConditionCount) {
    this.accurateConditionCount = accurateConditionCount;
  }

  public BigDecimal getShowupReliabilityScore() {
    return showupReliabilityScore;
  }

  public void setShowupReliabilityScore(BigDecimal showupReliabilityScore) {
    this.showupReliabilityScore = showupReliabilityScore;
  }

  public Integer getPickupCommitmentsCount() {
    return pickupCommitmentsCount;
  }

  public void setPickupCommitmentsCount(Integer pickupCommitmentsCount) {
    this.pickupCommitmentsCount = pickupCommitmentsCount;
  }

  public Integer getSuccessfulShowupsCount() {
    return successfulShowupsCount;
  }

  public void setSuccessfulShowupsCount(Integer successfulShowupsCount) {
    this.successfulShowupsCount = successfulShowupsCount;
  }

  public Integer getNoShowsCount() {
    return noShowsCount;
  }

  public void setNoShowsCount(Integer noShowsCount) {
    this.noShowsCount = noShowsCount;
  }

  public BigDecimal getResponseTimeScore() {
    return responseTimeScore;
  }

  public void setResponseTimeScore(BigDecimal responseTimeScore) {
    this.responseTimeScore = responseTimeScore;
  }

  public BigDecimal getAverageResponseTimeHours() {
    return averageResponseTimeHours;
  }

  public void setAverageResponseTimeHours(BigDecimal averageResponseTimeHours) {
    this.averageResponseTimeHours = averageResponseTimeHours;
  }

  public Integer getRequestsRespondedCount() {
    return requestsRespondedCount;
  }

  public void setRequestsRespondedCount(Integer requestsRespondedCount) {
    this.requestsRespondedCount = requestsRespondedCount;
  }

  public BigDecimal getCompletionRate() {
    return completionRate;
  }

  public void setCompletionRate(BigDecimal completionRate) {
    this.completionRate = completionRate;
  }

  public Integer getTotalTransactions() {
    return totalTransactions;
  }

  public void setTotalTransactions(Integer totalTransactions) {
    this.totalTransactions = totalTransactions;
  }

  public Integer getCompletedTransactions() {
    return completedTransactions;
  }

  public void setCompletedTransactions(Integer completedTransactions) {
    this.completedTransactions = completedTransactions;
  }

  public BigDecimal getCancellationRate() {
    return cancellationRate;
  }

  public void setCancellationRate(BigDecimal cancellationRate) {
    this.cancellationRate = cancellationRate;
  }

  public Integer getCancelledTransactions() {
    return cancelledTransactions;
  }

  public void setCancelledTransactions(Integer cancelledTransactions) {
    this.cancelledTransactions = cancelledTransactions;
  }

  public java.time.Instant getLastCalculatedAt() {
    return lastCalculatedAt;
  }

  public void setLastCalculatedAt(java.time.Instant lastCalculatedAt) {
    this.lastCalculatedAt = lastCalculatedAt;
  }
}


