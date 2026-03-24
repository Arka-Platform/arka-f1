package com.arka.modules.user.repository;

import com.arka.modules.user.entity.OtpEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OtpRepository extends JpaRepository<OtpEntity, java.util.UUID> {
  
  @Query("SELECT o FROM OtpEntity o WHERE o.emailOrPhone = :emailOrPhone AND o.otpType = :otpType AND o.used = false ORDER BY o.createdAt DESC")
  Optional<OtpEntity> findLatestUnusedOtp(@Param("emailOrPhone") String emailOrPhone, @Param("otpType") String otpType);
}

