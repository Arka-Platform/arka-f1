package com.arka.modules.demand.entity;

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
@Table(name = "book_requests")
public class BookRequestEntity extends BaseEntity {

  @Column(name = "requester_id", nullable = false)
  private UUID requesterId;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String author;

  @Column(length = 2000)
  private String description;

  @Column(length = 100)
  private String genre;

  @Column(length = 100)
  private String category;

  @Column(length = 100)
  private String subcategory;

  @Column(name = "isbn", length = 32)
  private String isbn;

  @Column(name = "max_price", precision = 10, scale = 2)
  private BigDecimal maxPrice;

  @Column(name = "preferred_condition", length = 20)
  private String preferredCondition; // NEW, LIKE_NEW, GOOD, FAIR, ANY

  @Column(name = "urgency", length = 20)
  private String urgency; // LOW, MEDIUM, HIGH

  @Column(name = "location", length = 200)
  private String location; // Preferred pickup/delivery location

  @Column(name = "additional_notes", columnDefinition = "TEXT")
  private String additionalNotes;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookRequestStatus status = BookRequestStatus.OPEN;

  @Column(name = "expires_at")
  private Instant expiresAt;

  @Column(name = "fulfilled_by")
  private UUID fulfilledBy; // Seller who committed to fulfill

  @Column(name = "fulfilled_at")
  private Instant fulfilledAt;

  @Column(name = "views_count")
  private Integer viewsCount = 0;

  @Column(name = "offers_count")
  private Integer offersCount = 0;

  protected BookRequestEntity() {
    // JPA
  }

  public BookRequestEntity(UUID requesterId, String title, String author) {
    this.requesterId = requesterId;
    this.title = title;
    this.author = author;
  }

  // Getters and Setters
  public UUID getRequesterId() {
    return requesterId;
  }

  public void setRequesterId(UUID requesterId) {
    this.requesterId = requesterId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getGenre() {
    return genre;
  }

  public void setGenre(String genre) {
    this.genre = genre;
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

  public String getIsbn() {
    return isbn;
  }

  public void setIsbn(String isbn) {
    this.isbn = isbn;
  }

  public BigDecimal getMaxPrice() {
    return maxPrice;
  }

  public void setMaxPrice(BigDecimal maxPrice) {
    this.maxPrice = maxPrice;
  }

  public String getPreferredCondition() {
    return preferredCondition;
  }

  public void setPreferredCondition(String preferredCondition) {
    this.preferredCondition = preferredCondition;
  }

  public String getUrgency() {
    return urgency;
  }

  public void setUrgency(String urgency) {
    this.urgency = urgency;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getAdditionalNotes() {
    return additionalNotes;
  }

  public void setAdditionalNotes(String additionalNotes) {
    this.additionalNotes = additionalNotes;
  }

  public BookRequestStatus getStatus() {
    return status;
  }

  public void setStatus(BookRequestStatus status) {
    this.status = status;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

  public UUID getFulfilledBy() {
    return fulfilledBy;
  }

  public void setFulfilledBy(UUID fulfilledBy) {
    this.fulfilledBy = fulfilledBy;
  }

  public Instant getFulfilledAt() {
    return fulfilledAt;
  }

  public void setFulfilledAt(Instant fulfilledAt) {
    this.fulfilledAt = fulfilledAt;
  }

  public Integer getViewsCount() {
    return viewsCount;
  }

  public void setViewsCount(Integer viewsCount) {
    this.viewsCount = viewsCount;
  }

  public Integer getOffersCount() {
    return offersCount;
  }

  public void setOffersCount(Integer offersCount) {
    this.offersCount = offersCount;
  }

  public void incrementViews() {
    this.viewsCount = (this.viewsCount == null ? 0 : this.viewsCount) + 1;
  }

  public void incrementOffers() {
    this.offersCount = (this.offersCount == null ? 0 : this.offersCount) + 1;
  }
}


