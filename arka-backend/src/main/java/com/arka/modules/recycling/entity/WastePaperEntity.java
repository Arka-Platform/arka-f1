package com.arka.modules.recycling.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "waste_paper")
public class WastePaperEntity extends BaseEntity {

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String description;

  @Column(length = 100)
  private String category; // e.g., "Newspaper", "Magazine", "Office Paper", "Cardboard"

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal weightKg;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal creditValue;

  @Column(name = "owner_id", nullable = false)
  private UUID ownerId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WastePaperStatus status = WastePaperStatus.AVAILABLE;

  protected WastePaperEntity() {
    // JPA
  }

  public WastePaperEntity(String title, String description, String category, 
                          BigDecimal weightKg, BigDecimal creditValue, UUID ownerId) {
    this.title = title;
    this.description = description;
    this.category = category;
    this.weightKg = weightKg;
    this.creditValue = creditValue;
    this.ownerId = ownerId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public BigDecimal getWeightKg() {
    return weightKg;
  }

  public void setWeightKg(BigDecimal weightKg) {
    this.weightKg = weightKg;
  }

  public BigDecimal getCreditValue() {
    return creditValue;
  }

  public void setCreditValue(BigDecimal creditValue) {
    this.creditValue = creditValue;
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public void setOwnerId(UUID ownerId) {
    this.ownerId = ownerId;
  }

  public WastePaperStatus getStatus() {
    return status;
  }

  public void setStatus(WastePaperStatus status) {
    this.status = status;
  }
}
















