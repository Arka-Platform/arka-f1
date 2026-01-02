package com.arka.modules.bookshelf.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/**
 * Entity to store books in a user's bookshelf (books they own/have at home).
 * This is different from wishlist which is for books they want to read next.
 */
@Entity
@Table(name = "bookshelf", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "book_id"})
})
public class BookshelfEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(name = "notes", columnDefinition = "TEXT")
  private String notes; // Optional notes about this book (e.g., "Gift from friend", "Read in 2023")

  protected BookshelfEntity() {
    // JPA
  }

  public BookshelfEntity(UUID userId, UUID bookId) {
    this.userId = userId;
    this.bookId = bookId;
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

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}


