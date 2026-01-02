package com.arka.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BookAnalyticsResponse(
    UUID bookId,
    String bookTitle,
    String bookAuthor,
    Integer totalViews,
    Integer totalPurchases,
    Integer totalLendings,
    Integer totalWishlistAdds,
    BigDecimal averageRating,
    Integer ratingsCount,
    BigDecimal popularityScore,
    String trendingStatus,
    Integer daysSincePublished
) {}










