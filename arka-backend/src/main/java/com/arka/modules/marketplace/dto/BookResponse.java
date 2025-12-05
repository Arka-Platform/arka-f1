package com.arka.modules.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookResponse(
    UUID id,
    String title,
    String author,
    String description,
    String genre,
    BigDecimal price,
    String status,
    Instant createdAt,
    String isbn,
    String publisher,
    Integer publicationYear,
    String imageUrl,
    String thumbnailUrl,
    BigDecimal averageRating,
    Integer ratingsCount
) {}











