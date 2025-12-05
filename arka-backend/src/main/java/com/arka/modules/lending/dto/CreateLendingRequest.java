package com.arka.modules.lending.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateLendingRequest(
    UUID bookId,
    UUID borrowerId,
    Instant expectedReturnDate,
    BigDecimal lendingFee,
    BigDecimal deposit,
    String notes
) {}



