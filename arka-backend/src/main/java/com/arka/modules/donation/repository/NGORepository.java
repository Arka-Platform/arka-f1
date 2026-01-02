package com.arka.modules.donation.repository;

import com.arka.modules.donation.entity.NGOEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NGORepository extends JpaRepository<NGOEntity, UUID> {
  List<NGOEntity> findByVerifiedTrue();
}


