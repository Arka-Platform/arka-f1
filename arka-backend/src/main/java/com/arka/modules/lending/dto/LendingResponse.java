package com.arka.modules.lending.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LendingResponse(
    UUID id,
    UUID bookId,
    String bookTitle,
    String bookAuthor,
    UUID ownerId,
    String ownerName,
    UUID borrowerId,
    String borrowerName,
    Instant requestedAt,
    Instant startDate,
    Instant expectedReturnDate,
    Instant actualReturnDate,
    BigDecimal lendingFee,
    BigDecimal deposit,
    String status,
    String notes,
    String conditionBefore,
    String conditionAfter
) {}










