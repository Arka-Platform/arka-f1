package com.arka.modules.analytics.service;

import com.arka.modules.analytics.dto.BookAnalyticsResponse;
import com.arka.modules.analytics.dto.PlatformInsightsResponse;
import com.arka.modules.analytics.dto.UserAnalyticsResponse;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.marketplace.repository.ExchangeRepository;
import com.arka.modules.user.entity.BehaviorType;
import com.arka.modules.user.entity.UserBehaviorEntity;
import com.arka.modules.user.repository.UserBehaviorRepository;
import com.arka.modules.user.repository.UserRepository;
import com.arka.modules.lending.repository.LendingRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

  private final UserRepository userRepository;
  private final BookRepository bookRepository;
  private final UserBehaviorRepository behaviorRepository;
  private final ExchangeRepository exchangeRepository;
  private final LendingRepository lendingRepository;

  public AnalyticsService(
      UserRepository userRepository,
      BookRepository bookRepository,
      UserBehaviorRepository behaviorRepository,
      ExchangeRepository exchangeRepository,
      LendingRepository lendingRepository) {
    this.userRepository = userRepository;
    this.bookRepository = bookRepository;
    this.behaviorRepository = behaviorRepository;
    this.exchangeRepository = exchangeRepository;
    this.lendingRepository = lendingRepository;
  }

  /**
   * Get user analytics
   */
  public UserAnalyticsResponse getUserAnalytics(UUID userId) {
    // Get user behaviors
    List<UserBehaviorEntity> behaviors = behaviorRepository.findByUserId(userId);
    
    int totalBooksRead = (int) behaviors.stream()
        .filter(b -> b.getBehaviorType() == BehaviorType.PURCHASE)
        .count();
    
    int totalBooksBought = totalBooksRead; // Same for now
    
    int totalBooksSold = (int) exchangeRepository.findBySellerId(userId).size();
    
    int totalBooksLent = (int) lendingRepository.findByOwnerId(userId).stream()
        .filter(l -> l.getStatus().name().equals("RETURNED"))
        .count();
    
    int totalBooksBorrowed = (int) lendingRepository.findByBorrowerId(userId).stream()
        .filter(l -> l.getStatus().name().equals("RETURNED"))
        .count();
    
    // Calculate spending (from exchanges where user is buyer)
    BigDecimal totalSpent = exchangeRepository.findByBuyerId(userId).stream()
        .map(e -> e.getCreditAmount().add(e.getServiceFee()))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    // Calculate earnings (from exchanges where user is seller)
    BigDecimal totalEarned = exchangeRepository.findBySellerId(userId).stream()
        .map(e -> e.getCreditAmount())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    // Get favorite genres and categories
    List<Object[]> topGenres = behaviorRepository.findTopCategories(userId);
    List<String> favoriteGenres = topGenres.stream()
        .map(g -> (String) g[0])
        .limit(5)
        .collect(Collectors.toList());
    
    List<Object[]> topCategories = behaviorRepository.findTopCategories(userId);
    List<String> favoriteCategories = topCategories.stream()
        .map(c -> (String) c[0])
        .limit(5)
        .collect(Collectors.toList());
    
    // Calculate reading streak (simplified - days with at least one book view)
    int readingStreak = calculateReadingStreak(userId);
    
    // Get user name
    String userName = userRepository.findById(userId)
        .map(u -> u.getFirstName() + " " + u.getLastName())
        .orElse("Unknown");
    
    return new UserAnalyticsResponse(
        userId,
        userName,
        totalBooksRead,
        totalBooksBought,
        totalBooksSold,
        totalBooksLent,
        totalBooksBorrowed,
        totalSpent,
        totalEarned,
        favoriteGenres,
        favoriteCategories,
        readingStreak,
        BigDecimal.ZERO, // TODO: Calculate from reviews
        0 // TODO: Count reviews
    );
  }

  /**
   * Get book analytics
   */
  public BookAnalyticsResponse getBookAnalytics(UUID bookId) {
    BookEntity book = bookRepository.findById(bookId)
        .orElse(null);
    if (book == null) {
      return null;
    }
    
    // Get behaviors for this book
    List<UserBehaviorEntity> behaviors = behaviorRepository.findByBookId(bookId);
    
    int totalViews = (int) behaviors.stream()
        .filter(b -> b.getBehaviorType() == BehaviorType.BOOK_VIEW)
        .count();
    
    int totalPurchases = (int) behaviors.stream()
        .filter(b -> b.getBehaviorType() == BehaviorType.PURCHASE)
        .count();
    
    int totalLendings = lendingRepository.findByBookId(bookId).size();
    
    int totalWishlistAdds = (int) behaviors.stream()
        .filter(b -> b.getBehaviorType() == BehaviorType.WISHLIST_ADD)
        .count();
    
    // Calculate popularity score
    BigDecimal popularityScore = calculatePopularityScore(
        totalViews, totalPurchases, totalLendings, totalWishlistAdds,
        book.getAverageRating(), book.getRatingsCount());
    
    // Determine trending status
    String trendingStatus = determineTrendingStatus(popularityScore, book.getCreatedAt());
    
    int daysSincePublished = (int) ChronoUnit.DAYS.between(
        book.getCreatedAt(), Instant.now());
    
    return new BookAnalyticsResponse(
        bookId,
        book.getTitle(),
        book.getAuthor(),
        totalViews,
        totalPurchases,
        totalLendings,
        totalWishlistAdds,
        book.getAverageRating(),
        book.getRatingsCount(),
        popularityScore,
        trendingStatus,
        daysSincePublished
    );
  }

  /**
   * Get platform insights
   */
  public PlatformInsightsResponse getPlatformInsights() {
    long totalUsers = userRepository.count();
    
    // Active users (users with activity in last 30 days)
    Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
    long activeUsers = behaviorRepository.findDistinctUsersSince(thirtyDaysAgo).size();
    
    long totalBooks = bookRepository.count();
    long availableBooks = bookRepository.countByStatus(BookStatus.PUBLISHED);
    long totalExchanges = exchangeRepository.count();
    long totalLendings = lendingRepository.count();
    
    // Calculate total revenue (service fees from exchanges)
    BigDecimal totalRevenue = exchangeRepository.findAll().stream()
        .map(e -> e.getServiceFee())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    // Calculate average book price
    BigDecimal averageBookPrice = bookRepository.findAll().stream()
        .map(BookEntity::getCreditPrice)
        .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
        .reduce(BigDecimal.ZERO, BigDecimal::add)
        .divide(BigDecimal.valueOf(bookRepository.count()), 2, RoundingMode.HALF_UP);
    
    // Books by genre
    Map<String, Long> booksByGenre = bookRepository.findAll().stream()
        .filter(b -> b.getGenre() != null)
        .collect(Collectors.groupingBy(
            BookEntity::getGenre,
            Collectors.counting()));
    
    // Books by category
    Map<String, Long> booksByCategory = bookRepository.findAll().stream()
        .filter(b -> b.getCategory() != null)
        .collect(Collectors.groupingBy(
            BookEntity::getCategory,
            Collectors.counting()));
    
    // Trending books
    List<PlatformInsightsResponse.TrendingBook> trendingBooks = getTrendingBooks(10);
    
    // Popular genres
    List<PlatformInsightsResponse.PopularGenre> popularGenres = getPopularGenres(10);
    
    // Monthly stats
    Instant oneMonthAgo = Instant.now().minus(30, ChronoUnit.DAYS);
    PlatformInsightsResponse.PlatformStats monthlyStats = getStatsSince(oneMonthAgo);
    
    // Weekly stats
    Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
    PlatformInsightsResponse.PlatformStats weeklyStats = getStatsSince(oneWeekAgo);
    
    return new PlatformInsightsResponse(
        totalUsers,
        activeUsers,
        totalBooks,
        availableBooks,
        totalExchanges,
        totalLendings,
        totalRevenue,
        averageBookPrice,
        booksByGenre,
        booksByCategory,
        trendingBooks,
        popularGenres,
        monthlyStats,
        weeklyStats
    );
  }

  private int calculateReadingStreak(UUID userId) {
    // Simplified: count consecutive days with book views
    List<UserBehaviorEntity> views = behaviorRepository.findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(
        userId, BehaviorType.BOOK_VIEW);
    
    if (views.isEmpty()) {
      return 0;
    }
    
    int streak = 1;
    Instant lastDate = views.get(0).getCreatedAt().truncatedTo(ChronoUnit.DAYS);
    
    for (int i = 1; i < views.size(); i++) {
      Instant currentDate = views.get(i).getCreatedAt().truncatedTo(ChronoUnit.DAYS);
      long daysBetween = ChronoUnit.DAYS.between(currentDate, lastDate);
      
      if (daysBetween == 1) {
        streak++;
        lastDate = currentDate;
      } else if (daysBetween > 1) {
        break;
      }
    }
    
    return streak;
  }

  private BigDecimal calculatePopularityScore(
      int views, int purchases, int lendings, int wishlistAdds,
      BigDecimal rating, Integer ratingsCount) {
    BigDecimal score = BigDecimal.ZERO;
    
    // Weighted scoring
    score = score.add(BigDecimal.valueOf(views * 0.1));
    score = score.add(BigDecimal.valueOf(purchases * 5));
    score = score.add(BigDecimal.valueOf(lendings * 3));
    score = score.add(BigDecimal.valueOf(wishlistAdds * 2));
    
    if (rating != null && ratingsCount != null && ratingsCount > 0) {
      score = score.add(rating.multiply(BigDecimal.valueOf(ratingsCount)).multiply(BigDecimal.valueOf(0.5)));
    }
    
    return score.setScale(2, RoundingMode.HALF_UP);
  }

  private String determineTrendingStatus(BigDecimal popularityScore, Instant createdAt) {
    long daysSinceCreated = ChronoUnit.DAYS.between(createdAt, Instant.now());
    
    if (daysSinceCreated <= 7 && popularityScore.compareTo(new BigDecimal("50")) > 0) {
      return "HOT";
    } else if (daysSinceCreated <= 30 && popularityScore.compareTo(new BigDecimal("30")) > 0) {
      return "TRENDING";
    } else if (popularityScore.compareTo(new BigDecimal("100")) > 0) {
      return "POPULAR";
    } else {
      return "NORMAL";
    }
  }

  private List<PlatformInsightsResponse.TrendingBook> getTrendingBooks(int limit) {
    Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
    
    return bookRepository.findAll().stream()
        .filter(b -> b.getStatus() == BookStatus.PUBLISHED)
        .filter(b -> b.getCreatedAt().isAfter(thirtyDaysAgo))
        .map(book -> {
          List<UserBehaviorEntity> behaviors = behaviorRepository.findByBookId(book.getId());
          int views = (int) behaviors.stream()
              .filter(b -> b.getBehaviorType() == BehaviorType.BOOK_VIEW)
              .count();
          int purchases = (int) behaviors.stream()
              .filter(b -> b.getBehaviorType() == BehaviorType.PURCHASE)
              .count();
          BigDecimal popularityScore = calculatePopularityScore(
              views, purchases, 0, 0,
              book.getAverageRating(), book.getRatingsCount());
          
          return new PlatformInsightsResponse.TrendingBook(
              book.getId().toString(),
              book.getTitle(),
              book.getAuthor(),
              views,
              purchases,
              popularityScore
          );
        })
        .sorted((a, b) -> b.popularityScore().compareTo(a.popularityScore()))
        .limit(limit)
        .collect(Collectors.toList());
  }

  private List<PlatformInsightsResponse.PopularGenre> getPopularGenres(int limit) {
    Map<String, Long> genreCounts = bookRepository.findAll().stream()
        .filter(b -> b.getGenre() != null)
        .collect(Collectors.groupingBy(
            BookEntity::getGenre,
            Collectors.counting()));
    
    return genreCounts.entrySet().stream()
        .map(entry -> {
          String genre = entry.getKey();
          long bookCount = entry.getValue();
          long exchangeCount = bookRepository.findAll().stream()
              .filter(b -> genre.equals(b.getGenre()))
              .mapToLong(b -> exchangeRepository.findByBookId(b.getId()).size())
              .sum();
          
          BigDecimal avgPrice = bookRepository.findAll().stream()
              .filter(b -> genre.equals(b.getGenre()))
              .map(BookEntity::getCreditPrice)
              .filter(p -> p != null)
              .reduce(BigDecimal.ZERO, BigDecimal::add)
              .divide(BigDecimal.valueOf(bookCount), 2, RoundingMode.HALF_UP);
          
          return new PlatformInsightsResponse.PopularGenre(
              genre,
              bookCount,
              exchangeCount,
              avgPrice
          );
        })
        .sorted((a, b) -> Long.compare(b.bookCount(), a.bookCount()))
        .limit(limit)
        .collect(Collectors.toList());
  }

  private PlatformInsightsResponse.PlatformStats getStatsSince(Instant since) {
    long newUsers = userRepository.findAll().stream()
        .filter(u -> u.getCreatedAt().isAfter(since))
        .count();
    
    long newBooks = bookRepository.findAll().stream()
        .filter(b -> b.getCreatedAt().isAfter(since))
        .count();
    
    long exchanges = exchangeRepository.findAll().stream()
        .filter(e -> e.getCreatedAt().isAfter(since))
        .count();
    
    long lendings = lendingRepository.findAll().stream()
        .filter(l -> l.getRequestedAt().isAfter(since))
        .count();
    
    BigDecimal revenue = exchangeRepository.findAll().stream()
        .filter(e -> e.getCreatedAt().isAfter(since))
        .map(e -> e.getServiceFee())
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    return new PlatformInsightsResponse.PlatformStats(
        newUsers,
        newBooks,
        exchanges,
        lendings,
        revenue
    );
  }
}

