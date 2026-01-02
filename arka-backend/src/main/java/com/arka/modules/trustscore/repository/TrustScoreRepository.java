package com.arka.modules.trustscore.repository;

import com.arka.modules.trustscore.entity.TrustScoreEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrustScoreRepository extends JpaRepository<TrustScoreEntity, UUID> {
  Optional<TrustScoreEntity> findByUserId(UUID userId);
}


