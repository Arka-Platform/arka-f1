package com.arka.modules.demand.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateBookRequestRequest(
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
    Instant expiresAt
) {}


