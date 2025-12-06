package com.arka.modules.subscription.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
public class SubscriptionEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "plan", nullable = false)
  private SubscriptionPlan plan;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

  @Column(name = "start_date", nullable = false)
  private Instant startDate;

  @Column(name = "end_date")
  private Instant endDate;

  @Column(name = "renewal_date")
  private Instant renewalDate;

  @Column(name = "monthly_price", precision = 10, scale = 2)
  private BigDecimal monthlyPrice;

  @Column(name = "auto_renew", nullable = false)
  private Boolean autoRenew = true;

  @Column(name = "books_per_month")
  private Integer booksPerMonth;

  @Column(name = "books_used_this_month")
  private Integer booksUsedThisMonth = 0;

  @Column(name = "unlimited_access", nullable = false)
  private Boolean unlimitedAccess = false;

  @Column(name = "priority_support", nullable = false)
  private Boolean prioritySupport = false;

  @Column(name = "ad_free", nullable = false)
  private Boolean adFree = false;

  protected SubscriptionEntity() {
    // JPA
  }

  public SubscriptionEntity(
      UUID userId,
      SubscriptionPlan plan,
      Instant startDate,
      Instant endDate,
      BigDecimal monthlyPrice,
      Integer booksPerMonth,
      Boolean unlimitedAccess,
      Boolean prioritySupport,
      Boolean adFree) {
    this.userId = userId;
    this.plan = plan;
    this.startDate = startDate;
    this.endDate = endDate;
    this.monthlyPrice = monthlyPrice;
    this.booksPerMonth = booksPerMonth;
    this.unlimitedAccess = unlimitedAccess;
    this.prioritySupport = prioritySupport;
    this.adFree = adFree;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public SubscriptionPlan getPlan() {
    return plan;
  }

  public void setPlan(SubscriptionPlan plan) {
    this.plan = plan;
  }

  public SubscriptionStatus getStatus() {
    return status;
  }

  public void setStatus(SubscriptionStatus status) {
    this.status = status;
  }

  public Instant getStartDate() {
    return startDate;
  }

  public void setStartDate(Instant startDate) {
    this.startDate = startDate;
  }

  public Instant getEndDate() {
    return endDate;
  }

  public void setEndDate(Instant endDate) {
    this.endDate = endDate;
  }

  public Instant getRenewalDate() {
    return renewalDate;
  }

  public void setRenewalDate(Instant renewalDate) {
    this.renewalDate = renewalDate;
  }

  public BigDecimal getMonthlyPrice() {
    return monthlyPrice;
  }

  public void setMonthlyPrice(BigDecimal monthlyPrice) {
    this.monthlyPrice = monthlyPrice;
  }

  public Boolean getAutoRenew() {
    return autoRenew;
  }

  public void setAutoRenew(Boolean autoRenew) {
    this.autoRenew = autoRenew;
  }

  public Integer getBooksPerMonth() {
    return booksPerMonth;
  }

  public void setBooksPerMonth(Integer booksPerMonth) {
    this.booksPerMonth = booksPerMonth;
  }

  public Integer getBooksUsedThisMonth() {
    return booksUsedThisMonth;
  }

  public void setBooksUsedThisMonth(Integer booksUsedThisMonth) {
    this.booksUsedThisMonth = booksUsedThisMonth;
  }

  public Boolean getUnlimitedAccess() {
    return unlimitedAccess;
  }

  public void setUnlimitedAccess(Boolean unlimitedAccess) {
    this.unlimitedAccess = unlimitedAccess;
  }

  public Boolean getPrioritySupport() {
    return prioritySupport;
  }

  public void setPrioritySupport(Boolean prioritySupport) {
    this.prioritySupport = prioritySupport;
  }

  public Boolean getAdFree() {
    return adFree;
  }

  public void setAdFree(Boolean adFree) {
    this.adFree = adFree;
  }

  public void incrementBooksUsed() {
    this.booksUsedThisMonth = (this.booksUsedThisMonth == null ? 0 : this.booksUsedThisMonth) + 1;
  }

  public boolean canBorrowBook() {
    if (status != SubscriptionStatus.ACTIVE) {
      return false;
    }
    if (unlimitedAccess) {
      return true;
    }
    if (booksPerMonth == null) {
      return false;
    }
    return booksUsedThisMonth < booksPerMonth;
  }
}





