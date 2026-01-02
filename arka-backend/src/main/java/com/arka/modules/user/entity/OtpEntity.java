package com.arka.modules.user.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "otps")
public class OtpEntity extends BaseEntity {

  @Column(nullable = false)
  private String emailOrPhone;

  @Column(nullable = false)
  private String otpCode;

  @Column(nullable = false)
  private String otpType;  // "email" or "phone"

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  @Column(nullable = false)
  private Boolean used = false;

  protected OtpEntity() {
    // JPA
  }

  public OtpEntity(String emailOrPhone, String otpCode, String otpType, LocalDateTime expiresAt) {
    this.emailOrPhone = emailOrPhone;
    this.otpCode = otpCode;
    this.otpType = otpType;
    this.expiresAt = expiresAt;
  }

  public String getEmailOrPhone() {
    return emailOrPhone;
  }

  public void setEmailOrPhone(String emailOrPhone) {
    this.emailOrPhone = emailOrPhone;
  }

  public String getOtpCode() {
    return otpCode;
  }

  public void setOtpCode(String otpCode) {
    this.otpCode = otpCode;
  }

  public String getOtpType() {
    return otpType;
  }

  public void setOtpType(String otpType) {
    this.otpType = otpType;
  }

  public LocalDateTime getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(LocalDateTime expiresAt) {
    this.expiresAt = expiresAt;
  }

  public Boolean getUsed() {
    return used;
  }

  public void setUsed(Boolean used) {
    this.used = used;
  }

  public boolean isExpired() {
    return LocalDateTime.now().isAfter(expiresAt);
  }
}




