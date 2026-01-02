package com.arka.modules.user.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "users")
public class UserEntity extends BaseEntity {

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String firstName;

  @Column(nullable = false)
  private String lastName;

  @Column(nullable = true)
  private String passwordHash;  // Nullable for OAuth users

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal creditBalance = BigDecimal.ZERO;

  @Column(length = 20)
  private String phoneNumber;

  @Column(nullable = false)
  private Boolean emailVerified = false;

  @Column(nullable = false)
  private Boolean phoneVerified = false;

  @Column(length = 50)
  private String oauthProvider;  // e.g., "google", "facebook"

  @Column(length = 255)
  private String oauthProviderId;  // User ID from OAuth provider

  @Column(nullable = false)
  private Boolean isAdmin = false;

  protected UserEntity() {
    // JPA
  }

  public UserEntity(String email, String firstName, String lastName, String passwordHash) {
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.passwordHash = passwordHash;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getFirstName() {
    return firstName;
  }

  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  public String getLastName() {
    return lastName;
  }

  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public BigDecimal getCreditBalance() {
    return creditBalance;
  }

  public void setCreditBalance(BigDecimal creditBalance) {
    this.creditBalance = creditBalance;
  }

  public void addCredits(BigDecimal amount) {
    this.creditBalance = this.creditBalance.add(amount);
  }

  public void deductCredits(BigDecimal amount) {
    if (this.creditBalance.compareTo(amount) < 0) {
      throw new IllegalArgumentException("Insufficient credits");
    }
    this.creditBalance = this.creditBalance.subtract(amount);
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  public Boolean getEmailVerified() {
    return emailVerified;
  }

  public void setEmailVerified(Boolean emailVerified) {
    this.emailVerified = emailVerified;
  }

  public Boolean getPhoneVerified() {
    return phoneVerified;
  }

  public void setPhoneVerified(Boolean phoneVerified) {
    this.phoneVerified = phoneVerified;
  }

  public String getOauthProvider() {
    return oauthProvider;
  }

  public void setOauthProvider(String oauthProvider) {
    this.oauthProvider = oauthProvider;
  }

  public String getOauthProviderId() {
    return oauthProviderId;
  }

  public void setOauthProviderId(String oauthProviderId) {
    this.oauthProviderId = oauthProviderId;
  }

  public Boolean getIsAdmin() {
    return isAdmin;
  }

  public void setIsAdmin(Boolean isAdmin) {
    this.isAdmin = isAdmin;
  }
}



























