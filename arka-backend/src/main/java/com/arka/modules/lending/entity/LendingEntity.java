package com.arka.modules.lending.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lendings")
public class LendingEntity extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "book_id", nullable = false)
  private com.arka.modules.marketplace.entity.BookEntity book;

  @Column(name = "owner_id", nullable = false)
  private UUID ownerId;

  @Column(name = "borrower_id", nullable = false)
  private UUID borrowerId;

  @Column(name = "requested_at", nullable = false)
  private Instant requestedAt;

  @Column(name = "start_date")
  private Instant startDate;

  @Column(name = "expected_return_date")
  private Instant expectedReturnDate;

  @Column(name = "actual_return_date")
  private Instant actualReturnDate;

  @Column(name = "lending_fee", precision = 10, scale = 2)
  private java.math.BigDecimal lendingFee;

  @Column(name = "deposit", precision = 10, scale = 2)
  private java.math.BigDecimal deposit;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private LendingStatus status = LendingStatus.PENDING;

  @Column(length = 1000)
  private String notes;

  @Column(name = "condition_before")
  private String conditionBefore;

  @Column(name = "condition_after")
  private String conditionAfter;

  protected LendingEntity() {
    // JPA
  }

  public LendingEntity(
      com.arka.modules.marketplace.entity.BookEntity book,
      UUID ownerId,
      UUID borrowerId,
      Instant expectedReturnDate,
      java.math.BigDecimal lendingFee,
      java.math.BigDecimal deposit) {
    this.book = book;
    this.ownerId = ownerId;
    this.borrowerId = borrowerId;
    this.requestedAt = Instant.now();
    this.expectedReturnDate = expectedReturnDate;
    this.lendingFee = lendingFee;
    this.deposit = deposit;
  }

  public com.arka.modules.marketplace.entity.BookEntity getBook() {
    return book;
  }

  public void setBook(com.arka.modules.marketplace.entity.BookEntity book) {
    this.book = book;
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public void setOwnerId(UUID ownerId) {
    this.ownerId = ownerId;
  }

  public UUID getBorrowerId() {
    return borrowerId;
  }

  public void setBorrowerId(UUID borrowerId) {
    this.borrowerId = borrowerId;
  }

  public Instant getRequestedAt() {
    return requestedAt;
  }

  public void setRequestedAt(Instant requestedAt) {
    this.requestedAt = requestedAt;
  }

  public Instant getStartDate() {
    return startDate;
  }

  public void setStartDate(Instant startDate) {
    this.startDate = startDate;
  }

  public Instant getExpectedReturnDate() {
    return expectedReturnDate;
  }

  public void setExpectedReturnDate(Instant expectedReturnDate) {
    this.expectedReturnDate = expectedReturnDate;
  }

  public Instant getActualReturnDate() {
    return actualReturnDate;
  }

  public void setActualReturnDate(Instant actualReturnDate) {
    this.actualReturnDate = actualReturnDate;
  }

  public java.math.BigDecimal getLendingFee() {
    return lendingFee;
  }

  public void setLendingFee(java.math.BigDecimal lendingFee) {
    this.lendingFee = lendingFee;
  }

  public java.math.BigDecimal getDeposit() {
    return deposit;
  }

  public void setDeposit(java.math.BigDecimal deposit) {
    this.deposit = deposit;
  }

  public LendingStatus getStatus() {
    return status;
  }

  public void setStatus(LendingStatus status) {
    this.status = status;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public String getConditionBefore() {
    return conditionBefore;
  }

  public void setConditionBefore(String conditionBefore) {
    this.conditionBefore = conditionBefore;
  }

  public String getConditionAfter() {
    return conditionAfter;
  }

  public void setConditionAfter(String conditionAfter) {
    this.conditionAfter = conditionAfter;
  }
}



