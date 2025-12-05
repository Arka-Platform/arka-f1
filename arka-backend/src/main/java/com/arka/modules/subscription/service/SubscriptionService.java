package com.arka.modules.subscription.service;

import com.arka.common.result.Result;
import com.arka.modules.subscription.dto.CreateSubscriptionRequest;
import com.arka.modules.subscription.dto.SubscriptionResponse;
import com.arka.modules.subscription.entity.SubscriptionEntity;
import com.arka.modules.subscription.entity.SubscriptionPlan;
import com.arka.modules.subscription.entity.SubscriptionStatus;
import com.arka.modules.subscription.repository.SubscriptionRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {

  private final SubscriptionRepository subscriptionRepository;
  private final UserRepository userRepository;

  public SubscriptionService(
      SubscriptionRepository subscriptionRepository,
      UserRepository userRepository) {
    this.subscriptionRepository = subscriptionRepository;
    this.userRepository = userRepository;
  }

  /**
   * Create or upgrade a subscription
   */
  @Transactional
  public Result<SubscriptionResponse> createSubscription(CreateSubscriptionRequest request) {
    SubscriptionPlan plan;
    try {
      plan = SubscriptionPlan.valueOf(request.plan().toUpperCase());
    } catch (IllegalArgumentException e) {
      return Result.failure("Invalid subscription plan: " + request.plan());
    }

    // Get user
    UserEntity user = userRepository.findById(request.userId())
        .orElse(null);
    if (user == null) {
      return Result.failure("User not found");
    }

    // Check if user already has an active subscription
    Optional<SubscriptionEntity> existing = subscriptionRepository.findByUserIdAndStatus(
        request.userId(), SubscriptionStatus.ACTIVE);
    
    if (existing.isPresent()) {
      return Result.failure("User already has an active subscription. Please cancel it first or upgrade.");
    }

    // Get plan details
    SubscriptionPlanDetails planDetails = getPlanDetails(plan);
    
    // Check if user has sufficient credits
    if (user.getCreditBalance().compareTo(planDetails.monthlyPrice()) < 0) {
      return Result.failure("Insufficient credits. Required: " + planDetails.monthlyPrice());
    }

    // Deduct credits
    user.deductCredits(planDetails.monthlyPrice());
    userRepository.save(user);

    // Create subscription
    Instant now = Instant.now();
    Instant endDate = now.plus(30, ChronoUnit.DAYS);
    Instant renewalDate = endDate;

    SubscriptionEntity subscription = new SubscriptionEntity(
        request.userId(),
        plan,
        now,
        endDate,
        planDetails.monthlyPrice(),
        planDetails.booksPerMonth(),
        planDetails.unlimitedAccess(),
        planDetails.prioritySupport(),
        planDetails.adFree()
    );
    subscription.setRenewalDate(renewalDate);
    subscription = subscriptionRepository.save(subscription);

    return Result.success(toResponse(subscription));
  }

  /**
   * Cancel a subscription
   */
  @Transactional
  public Result<SubscriptionResponse> cancelSubscription(UUID userId) {
    Optional<SubscriptionEntity> subscriptionOpt = subscriptionRepository.findByUserIdAndStatus(
        userId, SubscriptionStatus.ACTIVE);
    
    if (subscriptionOpt.isEmpty()) {
      return Result.failure("No active subscription found");
    }

    SubscriptionEntity subscription = subscriptionOpt.get();
    subscription.setStatus(SubscriptionStatus.CANCELLED);
    subscription.setAutoRenew(false);
    subscription = subscriptionRepository.save(subscription);

    return Result.success(toResponse(subscription));
  }

  /**
   * Renew a subscription
   */
  @Transactional
  public Result<SubscriptionResponse> renewSubscription(UUID userId) {
    Optional<SubscriptionEntity> subscriptionOpt = subscriptionRepository.findByUserId(userId);
    
    if (subscriptionOpt.isEmpty()) {
      return Result.failure("Subscription not found");
    }

    SubscriptionEntity subscription = subscriptionOpt.get();
    
    if (subscription.getStatus() != SubscriptionStatus.ACTIVE && 
        subscription.getStatus() != SubscriptionStatus.EXPIRED) {
      return Result.failure("Subscription cannot be renewed");
    }

    // Get user
    UserEntity user = userRepository.findById(userId)
        .orElse(null);
    if (user == null) {
      return Result.failure("User not found");
    }

    // Check if user has sufficient credits
    if (user.getCreditBalance().compareTo(subscription.getMonthlyPrice()) < 0) {
      return Result.failure("Insufficient credits. Required: " + subscription.getMonthlyPrice());
    }

    // Deduct credits
    user.deductCredits(subscription.getMonthlyPrice());
    userRepository.save(user);

    // Renew subscription
    Instant now = Instant.now();
    Instant endDate = subscription.getEndDate().isBefore(now) 
        ? now.plus(30, ChronoUnit.DAYS)
        : subscription.getEndDate().plus(30, ChronoUnit.DAYS);
    
    subscription.setEndDate(endDate);
    subscription.setRenewalDate(endDate);
    subscription.setStatus(SubscriptionStatus.ACTIVE);
    subscription.setBooksUsedThisMonth(0); // Reset monthly usage
    subscription = subscriptionRepository.save(subscription);

    return Result.success(toResponse(subscription));
  }

  /**
   * Get user's subscription
   */
  public Result<SubscriptionResponse> getUserSubscription(UUID userId) {
    Optional<SubscriptionEntity> subscription = subscriptionRepository.findByUserId(userId);
    if (subscription.isEmpty()) {
      return Result.failure("No subscription found");
    }
    return Result.success(toResponse(subscription.get()));
  }

  /**
   * Check if user can borrow a book based on subscription
   */
  public boolean canBorrowBook(UUID userId) {
    Optional<SubscriptionEntity> subscription = subscriptionRepository.findByUserIdAndStatus(
        userId, SubscriptionStatus.ACTIVE);
    if (subscription.isEmpty()) {
      return false;
    }
    return subscription.get().canBorrowBook();
  }

  /**
   * Record book usage for subscription
   */
  @Transactional
  public void recordBookUsage(UUID userId) {
    Optional<SubscriptionEntity> subscription = subscriptionRepository.findByUserIdAndStatus(
        userId, SubscriptionStatus.ACTIVE);
    if (subscription.isPresent()) {
      SubscriptionEntity sub = subscription.get();
      sub.incrementBooksUsed();
      subscriptionRepository.save(sub);
    }
  }

  /**
   * Process expired subscriptions
   */
  @Transactional
  public void processExpiredSubscriptions() {
    List<SubscriptionEntity> expired = subscriptionRepository.findExpiredSubscriptions();
    for (SubscriptionEntity subscription : expired) {
      if (subscription.getAutoRenew()) {
        // Attempt auto-renewal
        renewSubscription(subscription.getUserId());
      } else {
        subscription.setStatus(SubscriptionStatus.EXPIRED);
        subscriptionRepository.save(subscription);
      }
    }
  }

  private SubscriptionPlanDetails getPlanDetails(SubscriptionPlan plan) {
    return switch (plan) {
      case FREE -> new SubscriptionPlanDetails(
          BigDecimal.ZERO, 0, false, false, false);
      case BASIC -> new SubscriptionPlanDetails(
          new BigDecimal("9.99"), 3, false, false, false);
      case PREMIUM -> new SubscriptionPlanDetails(
          new BigDecimal("19.99"), 10, false, true, true);
      case UNLIMITED -> new SubscriptionPlanDetails(
          new BigDecimal("29.99"), null, true, true, true);
    };
  }

  private record SubscriptionPlanDetails(
      BigDecimal monthlyPrice,
      Integer booksPerMonth,
      Boolean unlimitedAccess,
      Boolean prioritySupport,
      Boolean adFree
  ) {}

  private SubscriptionResponse toResponse(SubscriptionEntity subscription) {
    return new SubscriptionResponse(
        subscription.getId(),
        subscription.getUserId(),
        subscription.getPlan().name(),
        subscription.getStatus().name(),
        subscription.getStartDate(),
        subscription.getEndDate(),
        subscription.getRenewalDate(),
        subscription.getMonthlyPrice(),
        subscription.getAutoRenew(),
        subscription.getBooksPerMonth(),
        subscription.getBooksUsedThisMonth(),
        subscription.getUnlimitedAccess(),
        subscription.getPrioritySupport(),
        subscription.getAdFree()
    );
  }
}

