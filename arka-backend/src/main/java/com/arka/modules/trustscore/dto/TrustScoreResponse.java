package com.arka.modules.trustscore.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TrustScoreResponse(
    UUID userId,
    BigDecimal trustScore,
    BigDecimal conditionAccuracyScore,
    Integer conditionAssessmentsCount,
    Integer accurateConditionCount,
    BigDecimal showupReliabilityScore,
    Integer pickupCommitmentsCount,
    Integer successfulShowupsCount,
    Integer noShowsCount,
    BigDecimal responseTimeScore,
    BigDecimal averageResponseTimeHours,
    Integer requestsRespondedCount,
    BigDecimal completionRate,
    Integer totalTransactions,
    Integer completedTransactions,
    BigDecimal cancellationRate,
    Integer cancelledTransactions,
    Instant lastCalculatedAt
) {}


