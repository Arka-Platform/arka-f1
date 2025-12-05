package com.arka.modules.marketplace.service;

import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.mapper.BookMapper;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.user.entity.BehaviorType;
import com.arka.modules.user.entity.UserBehaviorEntity;
import com.arka.modules.user.repository.UserBehaviorRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {
  private static final Comparator<BookEntity> POPULARITY_COMPARATOR =
      Comparator.<BookEntity, BigDecimal>comparing(
              book -> book.getAverageRating() != null ? book.getAverageRating() : BigDecimal.ZERO)
          .thenComparing(book -> book.getRatingsCount() != null ? book.getRatingsCount() : 0)
          .thenComparing(BookEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
          .reversed();

  private final BookRepository bookRepository;
  private final UserBehaviorRepository behaviorRepository;
  private final BookMapper bookMapper;

  public RecommendationService(
      BookRepository bookRepository,
      UserBehaviorRepository behaviorRepository,
      BookMapper bookMapper) {
    this.bookRepository = bookRepository;
    this.behaviorRepository = behaviorRepository;
    this.bookMapper = bookMapper;
  }

  /**
   * Get personalized recommendations for a user
   */
  public List<BookResponse> getRecommendations(UUID userId, int limit) {
    if (userId == null) {
      return getPopularBooks(limit);
    }

    List<BookResponse> recommendations = new ArrayList<>();
    
    // 1. Content-based: Based on user's past interactions
    recommendations.addAll(getContentBasedRecommendations(userId, limit / 2));
    
    // 2. Collaborative filtering: Based on similar users
    recommendations.addAll(getCollaborativeRecommendations(userId, limit / 2));
    
    // 3. Popular books: Fill remaining slots
    if (recommendations.size() < limit) {
      Set<UUID> excludeIds = recommendations.stream()
          .map(BookResponse::id)
          .collect(Collectors.toSet());
      recommendations.addAll(getPopularBooks(limit - recommendations.size(), excludeIds));
    }

    // Remove duplicates and limit
    return recommendations.stream()
        .distinct()
        .limit(limit)
        .collect(Collectors.toList());
  }

  /**
   * Content-based recommendations: Books similar to what user has interacted with
   */
  private List<BookResponse> getContentBasedRecommendations(UUID userId, int limit) {
    // Get user's top categories
    List<Object[]> topCategories = behaviorRepository.findTopCategories(userId);
    List<Object[]> topSubcategories = behaviorRepository.findTopSubcategories(userId);
    
    if (topCategories.isEmpty() && topSubcategories.isEmpty()) {
      return Collections.emptyList();
    }

    // Find books in user's preferred categories
    Set<UUID> excludeIds = behaviorRepository
        .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, BehaviorType.PURCHASE)
        .stream()
        .map(UserBehaviorEntity::getBookId)
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.toSet());

    List<BookEntity> recommendations = new ArrayList<>();
    
    // Recommend by category
    for (Object[] categoryData : topCategories) {
      String category = (String) categoryData[0];
      List<BookEntity> books = bookRepository.findAll().stream()
          .filter(b -> category.equals(b.getCategory()) || category.equals(b.getGenre()))
          .filter(b -> !excludeIds.contains(b.getId()))
          .filter(b -> b.getStatus().name().equals("PUBLISHED"))
          .limit(limit)
          .collect(Collectors.toList());
      recommendations.addAll(books);
    }
    
    // Recommend by subcategory
    for (Object[] subcategoryData : topSubcategories) {
      String subcategory = (String) subcategoryData[0];
      List<BookEntity> books = bookRepository.findAll().stream()
          .filter(b -> subcategory.equals(b.getSubcategory()))
          .filter(b -> !excludeIds.contains(b.getId()))
          .filter(b -> b.getStatus().name().equals("PUBLISHED"))
          .limit(limit)
          .collect(Collectors.toList());
      recommendations.addAll(books);
    }

    return recommendations.stream()
        .distinct()
        .limit(limit)
        .map(bookMapper::toResponse)
        .collect(Collectors.toList());
  }

  /**
   * Collaborative filtering: Books liked by similar users
   */
  private List<BookResponse> getCollaborativeRecommendations(UUID userId, int limit) {
    List<BehaviorType> interactionTypes = List.of(
        BehaviorType.PURCHASE, BehaviorType.CART_ADD, BehaviorType.WISHLIST_ADD);
    
    // Find similar users
    List<UUID> similarUsers = behaviorRepository.findSimilarUsers(userId, interactionTypes);
    
    if (similarUsers.isEmpty()) {
      return Collections.emptyList();
    }

    // Get books that similar users interacted with
    Set<UUID> userBookIds = behaviorRepository
        .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, BehaviorType.PURCHASE)
        .stream()
        .map(UserBehaviorEntity::getBookId)
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.toSet());

    Map<UUID, Integer> bookScores = new HashMap<>();
    
    for (UUID similarUserId : similarUsers) {
      List<UserBehaviorEntity> behaviors = behaviorRepository
          .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(similarUserId, BehaviorType.PURCHASE);
      
      for (UserBehaviorEntity behavior : behaviors) {
        if (behavior.getBookId() != null && !userBookIds.contains(behavior.getBookId())) {
          bookScores.merge(behavior.getBookId(), 1, Integer::sum);
        }
      }
    }

    // Get top scored books
    List<UUID> recommendedBookIds = bookScores.entrySet().stream()
        .sorted(Map.Entry.<UUID, Integer>comparingByValue().reversed())
        .limit(limit)
        .map(Map.Entry::getKey)
        .collect(Collectors.toList());

    return bookRepository.findAllById(recommendedBookIds).stream()
        .map(bookMapper::toResponse)
        .collect(Collectors.toList());
  }

  /**
   * Get popular books (trending)
   */
  public List<BookResponse> getPopularBooks(int limit) {
    return getPopularBooks(limit, Collections.emptySet());
  }

  private List<BookResponse> getPopularBooks(int limit, Set<UUID> excludeIds) {
    Instant since = Instant.now().minus(30, ChronoUnit.DAYS);
    List<BehaviorType> interactionTypes = List.of(
        BehaviorType.BOOK_VIEW, BehaviorType.CART_ADD, BehaviorType.PURCHASE);
    
    List<Object[]> popularData = behaviorRepository.findPopularBooks(interactionTypes, since);
    
    List<UUID> bookIds = popularData.stream()
        .map(data -> (UUID) data[0])
        .filter(id -> !excludeIds.contains(id))
        .limit(limit)
        .collect(Collectors.toList());

    if (bookIds.isEmpty()) {
      // Fallback to recent books
      return bookRepository.findAll().stream()
          .filter(b -> !excludeIds.contains(b.getId()))
          .filter(b -> b.getStatus() == BookStatus.PUBLISHED)
          .sorted(POPULARITY_COMPARATOR)
          .limit(limit)
          .map(bookMapper::toResponse)
          .collect(Collectors.toList());
    }

    return bookRepository.findAllById(bookIds).stream()
        .map(bookMapper::toResponse)
        .collect(Collectors.toList());
  }

  /**
   * Get recommendations based on a specific book (similar books)
   */
  public List<BookResponse> getSimilarBooks(UUID bookId, int limit) {
    BookEntity book = bookRepository.findById(bookId).orElse(null);
    if (book == null) {
      return Collections.emptyList();
    }

    return bookRepository.findAll().stream()
        .filter(b -> !b.getId().equals(bookId))
        .filter(b -> b.getStatus() == BookStatus.PUBLISHED)
        .filter(b -> {
          // Similar by genre
          if (book.getGenre() != null && book.getGenre().equals(b.getGenre())) {
            return true;
          }
          // Similar by category
          if (book.getCategory() != null && book.getCategory().equals(b.getCategory())) {
            return true;
          }
          // Similar by subcategory
          if (book.getSubcategory() != null && book.getSubcategory().equals(b.getSubcategory())) {
            return true;
          }
          return false;
        })
        .limit(limit)
        .map(bookMapper::toResponse)
        .collect(Collectors.toList());
  }

  /**
   * Get trending books in a category
   */
  public List<BookResponse> getTrendingInCategory(String category, int limit) {
    List<BookEntity> categoryBooks = bookRepository.findAll().stream()
        .filter(b -> {
          String cat = b.getCategory();
          String genre = b.getGenre();
          return (cat != null && cat.equalsIgnoreCase(category))
              || (genre != null && genre.equalsIgnoreCase(category));
        })
        .filter(b -> b.getStatus() == BookStatus.PUBLISHED)
        .collect(Collectors.toList());

    if (categoryBooks.isEmpty()) {
      return Collections.emptyList();
    }

    return categoryBooks.stream()
        .sorted(POPULARITY_COMPARATOR)
        .limit(limit)
        .map(bookMapper::toResponse)
        .collect(Collectors.toList());
  }
}

