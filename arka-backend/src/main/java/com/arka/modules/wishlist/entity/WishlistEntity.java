package com.arka.modules.wishlist.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "wishlists")
public class WishlistEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(name = "notes", length = 500)
  private String notes; // Optional notes about why this book is in the wishlist

  protected WishlistEntity() {
    // JPA
  }

  public WishlistEntity(UUID userId, UUID bookId) {
    this.userId = userId;
    this.bookId = bookId;
  }

  // Getters and Setters
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

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}


