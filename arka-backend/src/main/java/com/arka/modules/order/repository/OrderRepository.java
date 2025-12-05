package com.arka.modules.order.repository;

import com.arka.modules.order.entity.OrderEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
  List<OrderEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  List<OrderEntity> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, com.arka.modules.order.entity.OrderStatus status);
}

