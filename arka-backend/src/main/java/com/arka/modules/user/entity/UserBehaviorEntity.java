package com.arka.modules.user.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "user_behaviors")
public class UserBehaviorEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "book_id")
  private UUID bookId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BehaviorType behaviorType;

  @Column(length = 500)
  private String searchQuery; // For search behaviors

  @Column(length = 100)
  private String category; // Genre, exam type, etc.

  @Column(length = 100)
  private String subcategory; // UPSC, CAT, etc.

  @Column
  private Integer durationSeconds; // For view behaviors

  protected UserBehaviorEntity() {
    // JPA
  }

  public UserBehaviorEntity(UUID userId, BehaviorType behaviorType) {
    this.userId = userId;
    this.behaviorType = behaviorType;
  }

  public UserBehaviorEntity(UUID userId, UUID bookId, BehaviorType behaviorType) {
    this.userId = userId;
    this.bookId = bookId;
    this.behaviorType = behaviorType;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public UUID getBookId() {
    return bookId;
  }

  public void setBookId(UUID bookId) {
    this.bookId = bookId;
  }

  public BehaviorType getBehaviorType() {
    return behaviorType;
  }

  public void setBehaviorType(BehaviorType behaviorType) {
    this.behaviorType = behaviorType;
  }

  public String getSearchQuery() {
    return searchQuery;
  }

  public void setSearchQuery(String searchQuery) {
    this.searchQuery = searchQuery;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getSubcategory() {
    return subcategory;
  }

  public void setSubcategory(String subcategory) {
    this.subcategory = subcategory;
  }

  public Integer getDurationSeconds() {
    return durationSeconds;
  }

  public void setDurationSeconds(Integer durationSeconds) {
    this.durationSeconds = durationSeconds;
  }
}
















