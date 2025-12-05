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
@Table(name = "books")
public class BookEntity extends BaseEntity {

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String author;

  @Column(length = 2000)
  private String description;

  @Column(length = 100)
  private String genre;

  @Column(length = 100)
  private String category; // e.g., "Competitive Exams", "Academic", "Fiction"

  @Column(length = 100)
  private String subcategory; // e.g., "UPSC", "CAT", "GATE", "JEE", "NEET"

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal creditPrice;

  @Column(length = 32, unique = true)
  private String isbn;

  @Column(length = 255)
  private String publisher;

  @Column(name = "publication_year")
  private Integer publicationYear;

  @Column(name = "image_url_small", length = 500)
  private String imageUrlSmall;

  @Column(name = "image_url_medium", length = 500)
  private String imageUrlMedium;

  @Column(name = "image_url_large", length = 500)
  private String imageUrlLarge;

  @Column(name = "average_rating", precision = 4, scale = 2)
  private BigDecimal averageRating;

  @Column(name = "ratings_count")
  private Integer ratingsCount;

  @Column(name = "owner_id", nullable = false)
  private UUID ownerId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookStatus status = BookStatus.DRAFT;

  protected BookEntity() {
    // JPA
  }

  public BookEntity(String title, String author, String description, String genre, BigDecimal creditPrice, UUID ownerId) {
    this.title = title;
    this.author = author;
    this.description = description;
    this.genre = genre;
    this.creditPrice = creditPrice;
    this.ownerId = ownerId;
  }

  public BookEntity(String title, String author, String description, String genre, String category, String subcategory, BigDecimal creditPrice, UUID ownerId) {
    this.title = title;
    this.author = author;
    this.description = description;
    this.genre = genre;
    this.category = category;
    this.subcategory = subcategory;
    this.creditPrice = creditPrice;
    this.ownerId = ownerId;
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

  public BigDecimal getCreditPrice() {
    return creditPrice;
  }

  public void setCreditPrice(BigDecimal creditPrice) {
    this.creditPrice = creditPrice;
  }

  public String getIsbn() {
    return isbn;
  }

  public void setIsbn(String isbn) {
    this.isbn = isbn;
  }

  public String getPublisher() {
    return publisher;
  }

  public void setPublisher(String publisher) {
    this.publisher = publisher;
  }

  public Integer getPublicationYear() {
    return publicationYear;
  }

  public void setPublicationYear(Integer publicationYear) {
    this.publicationYear = publicationYear;
  }

  public String getImageUrlSmall() {
    return imageUrlSmall;
  }

  public void setImageUrlSmall(String imageUrlSmall) {
    this.imageUrlSmall = imageUrlSmall;
  }

  public String getImageUrlMedium() {
    return imageUrlMedium;
  }

  public void setImageUrlMedium(String imageUrlMedium) {
    this.imageUrlMedium = imageUrlMedium;
  }

  public String getImageUrlLarge() {
    return imageUrlLarge;
  }

  public void setImageUrlLarge(String imageUrlLarge) {
    this.imageUrlLarge = imageUrlLarge;
  }

  public BigDecimal getAverageRating() {
    return averageRating;
  }

  public void setAverageRating(BigDecimal averageRating) {
    this.averageRating = averageRating;
  }

  public Integer getRatingsCount() {
    return ratingsCount;
  }

  public void setRatingsCount(Integer ratingsCount) {
    this.ratingsCount = ratingsCount;
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public void setOwnerId(UUID ownerId) {
    this.ownerId = ownerId;
  }

  public BookStatus getStatus() {
    return status;
  }

  public void setStatus(BookStatus status) {
    this.status = status;
  }
}


