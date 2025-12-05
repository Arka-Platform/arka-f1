package com.arka.modules.subscription.repository;

import com.arka.modules.subscription.entity.SubscriptionEntity;
import com.arka.modules.subscription.entity.SubscriptionPlan;
import com.arka.modules.subscription.entity.SubscriptionStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SubscriptionRepository extends JpaRepository<SubscriptionEntity, UUID> {
  
  Optional<SubscriptionEntity> findByUserId(UUID userId);
  
  List<SubscriptionEntity> findByStatus(SubscriptionStatus status);
  
  List<SubscriptionEntity> findByPlan(SubscriptionPlan plan);
  
  @Query("SELECT s FROM SubscriptionEntity s WHERE s.userId = :userId AND s.status = :status")
  Optional<SubscriptionEntity> findByUserIdAndStatus(UUID userId, SubscriptionStatus status);
  
  @Query("SELECT s FROM SubscriptionEntity s WHERE s.status = 'ACTIVE' AND s.endDate < CURRENT_TIMESTAMP")
  List<SubscriptionEntity> findExpiredSubscriptions();
  
  @Query("SELECT COUNT(s) FROM SubscriptionEntity s WHERE s.status = 'ACTIVE' AND s.plan = :plan")
  Long countActiveByPlan(SubscriptionPlan plan);
}



