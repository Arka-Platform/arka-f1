package com.arka.modules.marketplace.repository;

import com.arka.modules.marketplace.entity.ExchangeEntity;
import com.arka.modules.marketplace.entity.ExchangeStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExchangeRepository extends JpaRepository<ExchangeEntity, UUID> {
  List<ExchangeEntity> findByBuyerIdOrSellerId(UUID buyerId, UUID sellerId);
  List<ExchangeEntity> findByStatus(ExchangeStatus status);
  List<ExchangeEntity> findByBookId(UUID bookId);
  List<ExchangeEntity> findByBuyerId(UUID buyerId);
  List<ExchangeEntity> findBySellerId(UUID sellerId);
}





















