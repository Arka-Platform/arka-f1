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

  @Column(nullable = false)
  private String passwordHash;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal creditBalance = BigDecimal.ZERO;

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
}

























