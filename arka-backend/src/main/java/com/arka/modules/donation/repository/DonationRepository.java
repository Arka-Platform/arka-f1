package com.arka.modules.donation.repository;

import com.arka.modules.donation.entity.DonationEntity;
import com.arka.modules.donation.entity.DonationStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DonationRepository extends JpaRepository<DonationEntity, UUID> {
  List<DonationEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  
  List<DonationEntity> findByNgoIdOrderByCreatedAtDesc(UUID ngoId);
  
  List<DonationEntity> findByStatus(DonationStatus status);
  
  @Query("SELECT COUNT(d) FROM DonationEntity d WHERE d.ngoId = :ngoId AND d.status = 'COMPLETED'")
  Long countCompletedByNgoId(@Param("ngoId") UUID ngoId);
}

