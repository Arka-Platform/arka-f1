package com.arka.modules.wishlist.repository;

import com.arka.modules.wishlist.entity.WishlistEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistRepository extends JpaRepository<WishlistEntity, UUID> {
  
  List<WishlistEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  
  Optional<WishlistEntity> findByUserIdAndBookId(UUID userId, UUID bookId);
  
  boolean existsByUserIdAndBookId(UUID userId, UUID bookId);
  
  void deleteByUserIdAndBookId(UUID userId, UUID bookId);
  
  long countByUserId(UUID userId);
}


