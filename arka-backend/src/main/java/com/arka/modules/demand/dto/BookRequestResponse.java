package com.arka.modules.demand.dto;

import com.arka.modules.demand.entity.BookRequestStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookRequestResponse(
    UUID id,
    UUID requesterId,
    String requesterName,
    String requesterEmail,
    String title,
    String author,
    String description,
    String genre,
    String category,
    String subcategory,
    String isbn,
    BigDecimal maxPrice,
    String preferredCondition,
    String urgency,
    String location,
    String additionalNotes,
    BookRequestStatus status,
    Instant expiresAt,
    UUID fulfilledBy,
    String fulfilledByName,
    Instant fulfilledAt,
    Integer viewsCount,
    Integer offersCount,
    Instant createdAt,
    Instant updatedAt
) {}


