package com.arka.modules.demand.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RequestMatchResponse(
    UUID requestId,
    String requestTitle,
    String requestAuthor,
    String requestGenre,
    BigDecimal maxPrice,
    String urgency,
    String location,
    Integer viewsCount,
    double matchScore,
    List<String> matchReasons
) {}


