package com.arka.modules.marketplace.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "exchanges")
public class ExchangeEntity extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "book_id", nullable = false)
  private BookEntity book;

  @Column(name = "seller_id", nullable = false)
  private UUID sellerId;

  @Column(name = "buyer_id", nullable = false)
  private UUID buyerId;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal creditAmount;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal serviceFee;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ExchangeStatus status = ExchangeStatus.PENDING;

  protected ExchangeEntity() {
    // JPA
  }

  public ExchangeEntity(BookEntity book, UUID sellerId, UUID buyerId, BigDecimal creditAmount, BigDecimal serviceFee) {
    this.book = book;
    this.sellerId = sellerId;
    this.buyerId = buyerId;
    this.creditAmount = creditAmount;
    this.serviceFee = serviceFee;
  }

  public BookEntity getBook() {
    return book;
  }

  public void setBook(BookEntity book) {
    this.book = book;
  }

  public UUID getSellerId() {
    return sellerId;
  }

  public void setSellerId(UUID sellerId) {
    this.sellerId = sellerId;
  }

  public UUID getBuyerId() {
    return buyerId;
  }

  public void setBuyerId(UUID buyerId) {
    this.buyerId = buyerId;
  }

  public BigDecimal getCreditAmount() {
    return creditAmount;
  }

  public void setCreditAmount(BigDecimal creditAmount) {
    this.creditAmount = creditAmount;
  }

  public BigDecimal getServiceFee() {
    return serviceFee;
  }

  public void setServiceFee(BigDecimal serviceFee) {
    this.serviceFee = serviceFee;
  }

  public ExchangeStatus getStatus() {
    return status;
  }

  public void setStatus(ExchangeStatus status) {
    this.status = status;
  }
}























