package com.arka.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record PlatformInsightsResponse(
    Long totalUsers,
    Long activeUsers,
    Long totalBooks,
    Long availableBooks,
    Long totalExchanges,
    Long totalLendings,
    BigDecimal totalRevenue,
    BigDecimal averageBookPrice,
    Map<String, Long> booksByGenre,
    Map<String, Long> booksByCategory,
    List<TrendingBook> trendingBooks,
    List<PopularGenre> popularGenres,
    PlatformStats monthlyStats,
    PlatformStats weeklyStats
) {
  public record TrendingBook(
      String bookId,
      String title,
      String author,
      Integer views,
      Integer purchases,
      BigDecimal popularityScore
  ) {}

  public record PopularGenre(
      String genre,
      Long bookCount,
      Long exchangeCount,
      BigDecimal averagePrice
  ) {}

  public record PlatformStats(
      Long newUsers,
      Long newBooks,
      Long exchanges,
      Long lendings,
      BigDecimal revenue
  ) {}
}





