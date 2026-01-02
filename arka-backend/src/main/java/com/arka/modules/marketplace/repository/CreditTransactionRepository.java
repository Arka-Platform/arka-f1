package com.arka.modules.marketplace.repository;

import com.arka.modules.marketplace.entity.CreditTransactionEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransactionEntity, UUID> {
  List<CreditTransactionEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  List<CreditTransactionEntity> findByExchangeId(UUID exchangeId);
}






























