package com.arka.modules.wishlist.service;

import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import com.arka.modules.wishlist.dto.AddToWishlistRequest;
import com.arka.modules.wishlist.dto.WishlistItemResponse;
import com.arka.modules.wishlist.entity.WishlistEntity;
import com.arka.modules.wishlist.repository.WishlistRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistService {
  private final WishlistRepository wishlistRepository;
  private final BookRepository bookRepository;
  private final UserRepository userRepository;

  public WishlistService(
      WishlistRepository wishlistRepository,
      BookRepository bookRepository,
      UserRepository userRepository) {
    this.wishlistRepository = wishlistRepository;
    this.bookRepository = bookRepository;
    this.userRepository = userRepository;
  }

  /**
   * Add a book to user's wishlist
   */
  @Transactional
  public WishlistItemResponse addToWishlist(UUID userId, UUID bookId, AddToWishlistRequest request) {
    // Check if user exists
    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user == null) {
      throw new IllegalArgumentException("User not found with ID: " + userId);
    }

    // Check if book exists
    BookEntity book = bookRepository.findById(bookId).orElse(null);
    if (book == null) {
      throw new IllegalArgumentException("Book not found with ID: " + bookId);
    }

    // Check if already in wishlist
    if (wishlistRepository.existsByUserIdAndBookId(userId, bookId)) {
      throw new IllegalArgumentException("Book is already in your wishlist");
    }

    // Create wishlist item
    WishlistEntity wishlistItem = new WishlistEntity(userId, bookId);
    if (request != null && request.notes() != null && !request.notes().trim().isEmpty()) {
      wishlistItem.setNotes(request.notes().trim());
    }
    wishlistItem = wishlistRepository.save(wishlistItem);

    return toResponse(wishlistItem, book, user);
  }

  /**
   * Remove a book from user's wishlist
   */
  @Transactional
  public void removeFromWishlist(UUID userId, UUID bookId) {
    if (!wishlistRepository.existsByUserIdAndBookId(userId, bookId)) {
      throw new IllegalArgumentException("Book is not in your wishlist");
    }
    wishlistRepository.deleteByUserIdAndBookId(userId, bookId);
  }

  /**
   * Get user's wishlist
   */
  public List<WishlistItemResponse> getWishlist(UUID userId) {
    List<WishlistEntity> wishlistItems = wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId);
    
    return wishlistItems.stream()
        .map(item -> {
          BookEntity book = bookRepository.findById(item.getBookId()).orElse(null);
          if (book == null) {
            return null; // Book was deleted
          }
          UserEntity bookOwner = userRepository.findById(book.getOwnerId()).orElse(null);
          return toResponse(item, book, bookOwner);
        })
        .filter(item -> item != null) // Filter out deleted books
        .collect(Collectors.toList());
  }

  /**
   * Check if a book is in user's wishlist
   */
  public boolean isInWishlist(UUID userId, UUID bookId) {
    return wishlistRepository.existsByUserIdAndBookId(userId, bookId);
  }

  /**
   * Get wishlist count for a user
   */
  public long getWishlistCount(UUID userId) {
    return wishlistRepository.countByUserId(userId);
  }

  /**
   * Convert entity to response DTO
   */
  private WishlistItemResponse toResponse(WishlistEntity item, BookEntity book, UserEntity bookOwner) {
    String ownerName = "Unknown";
    if (bookOwner != null) {
      ownerName = bookOwner.getFirstName() + " " + bookOwner.getLastName();
    }

    return new WishlistItemResponse(
        item.getId(),
        book.getId(),
        book.getTitle(),
        book.getAuthor(),
        book.getGenre(),
        book.getDescription(),
        book.getCreditPrice(),
        book.getImageUrlMedium(),
        book.getStatus().toString(),
        book.getOwnerId(),
        ownerName,
        item.getNotes(),
        item.getCreatedAt()
    );
  }
}


