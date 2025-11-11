package com.arka.modules.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookResponse(
    UUID id,
    String title,
    String author,
    String description,
    BigDecimal price,
    String status,
    Instant createdAt
) {}

