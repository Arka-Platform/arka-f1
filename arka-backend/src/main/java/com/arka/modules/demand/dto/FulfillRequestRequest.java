package com.arka.modules.demand.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FulfillRequestRequest(
    UUID bookId,  // The book the seller wants to use to fulfill this request
    BigDecimal offeredPrice,
    String condition,
    String notes
) {}


