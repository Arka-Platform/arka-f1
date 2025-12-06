package com.arka.modules.lending.repository;

import com.arka.modules.lending.entity.LendingEntity;
import com.arka.modules.lending.entity.LendingStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface LendingRepository extends JpaRepository<LendingEntity, UUID> {
  
  List<LendingEntity> findByOwnerId(UUID ownerId);
  
  List<LendingEntity> findByBorrowerId(UUID borrowerId);
  
  List<LendingEntity> findByBookId(UUID bookId);
  
  List<LendingEntity> findByOwnerIdOrBorrowerId(UUID ownerId, UUID borrowerId);
  
  List<LendingEntity> findByStatus(LendingStatus status);
  
  @Query("SELECT l FROM LendingEntity l WHERE l.book.id = :bookId AND l.status IN :statuses")
  List<LendingEntity> findByBookIdAndStatusIn(UUID bookId, List<LendingStatus> statuses);
  
  @Query("SELECT l FROM LendingEntity l WHERE l.borrowerId = :borrowerId AND l.status = :status")
  List<LendingEntity> findByBorrowerIdAndStatus(UUID borrowerId, LendingStatus status);
  
  @Query("SELECT l FROM LendingEntity l WHERE l.ownerId = :ownerId AND l.status = :status")
  List<LendingEntity> findByOwnerIdAndStatus(UUID ownerId, LendingStatus status);
}





