package com.arka.modules.subscription.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SubscriptionResponse(
    UUID id,
    UUID userId,
    String plan,
    String status,
    Instant startDate,
    Instant endDate,
    Instant renewalDate,
    BigDecimal monthlyPrice,
    Boolean autoRenew,
    Integer booksPerMonth,
    Integer booksUsedThisMonth,
    Boolean unlimitedAccess,
    Boolean prioritySupport,
    Boolean adFree
) {}





