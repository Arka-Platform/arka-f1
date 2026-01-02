package com.arka.modules.wishlist.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WishlistItemResponse(
    UUID wishlistId,
    UUID bookId,
    String bookTitle,
    String bookAuthor,
    String bookGenre,
    String bookDescription,
    BigDecimal bookPrice,
    String bookImageUrl,
    String bookStatus,
    UUID bookOwnerId,
    String bookOwnerName,
    String notes,
    Instant addedAt
) {}


