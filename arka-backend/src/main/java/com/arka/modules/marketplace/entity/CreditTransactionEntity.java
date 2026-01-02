package com.arka.modules.marketplace.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "credit_transactions")
public class CreditTransactionEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "exchange_id")
  private UUID exchangeId;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CreditTransactionType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CreditTransactionDirection direction;

  @Column(length = 500)
  private String description;

  protected CreditTransactionEntity() {
    // JPA
  }

  public CreditTransactionEntity(UUID userId, UUID exchangeId, BigDecimal amount, 
                                  CreditTransactionType type, CreditTransactionDirection direction, 
                                  String description) {
    this.userId = userId;
    this.exchangeId = exchangeId;
    this.amount = amount;
    this.type = type;
    this.direction = direction;
    this.description = description;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public UUID getExchangeId() {
    return exchangeId;
  }

  public void setExchangeId(UUID exchangeId) {
    this.exchangeId = exchangeId;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public void setAmount(BigDecimal amount) {
    this.amount = amount;
  }

  public CreditTransactionType getType() {
    return type;
  }

  public void setType(CreditTransactionType type) {
    this.type = type;
  }

  public CreditTransactionDirection getDirection() {
    return direction;
  }

  public void setDirection(CreditTransactionDirection direction) {
    this.direction = direction;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }
}






























