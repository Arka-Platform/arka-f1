package com.arka.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record UserAnalyticsResponse(
    UUID userId,
    String userName,
    Integer totalBooksRead,
    Integer totalBooksBought,
    Integer totalBooksSold,
    Integer totalBooksLent,
    Integer totalBooksBorrowed,
    BigDecimal totalSpent,
    BigDecimal totalEarned,
    List<String> favoriteGenres,
    List<String> favoriteCategories,
    Integer readingStreak,
    BigDecimal averageRatingGiven,
    Integer reviewsWritten
) {}










