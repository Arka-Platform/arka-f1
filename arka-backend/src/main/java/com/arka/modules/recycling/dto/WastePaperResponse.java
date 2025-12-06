package com.arka.modules.recycling.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WastePaperResponse(
    UUID id,
    String title,
    String description,
    String category,
    BigDecimal weightKg,
    BigDecimal creditValue,
    String status,
    Instant createdAt
) {}
















