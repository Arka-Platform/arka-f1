package com.arka.modules.bookshelf.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookshelfItemResponse(
    UUID id,
    UUID userId,
    UUID bookId,
    String bookTitle,
    String bookAuthor,
    String bookImageUrl,
    BigDecimal bookPrice,
    String notes,
    Instant addedAt
) {}


