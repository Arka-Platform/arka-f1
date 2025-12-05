package com.arka.modules.marketplace.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExchangeResponse(
    UUID id,
    UUID bookId,
    String bookTitle,
    String bookAuthor,
    UUID sellerId,
    String sellerName,
    UUID buyerId,
    String buyerName,
    BigDecimal creditAmount,
    BigDecimal serviceFee,
    String status,
    Instant createdAt,
    Instant updatedAt
) {}










