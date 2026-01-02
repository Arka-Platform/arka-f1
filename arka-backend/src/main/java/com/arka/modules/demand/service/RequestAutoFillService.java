package com.arka.modules.demand.service;

import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.user.entity.BehaviorType;
import com.arka.modules.user.entity.UserBehaviorEntity;
import com.arka.modules.user.repository.UserBehaviorRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Service to auto-fill book request fields based on user behavior and preferences
 * Similar to Uber/BlinkIt auto-fill for better UX
 */
@Service
public class RequestAutoFillService {
  private final UserBehaviorRepository behaviorRepository;
  private final BookRepository bookRepository;

  public RequestAutoFillService(
      UserBehaviorRepository behaviorRepository,
      BookRepository bookRepository) {
    this.behaviorRepository = behaviorRepository;
    this.bookRepository = bookRepository;
  }

  /**
   * Get auto-fill suggestions for a user based on their behavior
   */
  public AutoFillSuggestions getAutoFillSuggestions(UUID userId) {
    AutoFillSuggestions suggestions = new AutoFillSuggestions();

    try {
      // Get user's recent searches
      List<UserBehaviorEntity> recentSearches = behaviorRepository
          .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, BehaviorType.BOOK_SEARCH);
      
      if (recentSearches != null && !recentSearches.isEmpty()) {
        // Extract search queries
        suggestions.recentSearches = recentSearches.stream()
            .map(UserBehaviorEntity::getSearchQuery)
            .filter(query -> query != null && !query.trim().isEmpty())
            .distinct()
            .limit(5)
            .collect(Collectors.toList());
      }

      // Get user's favorite genres from behavior
      try {
        List<Object[]> topGenres = behaviorRepository.findTopCategories(userId);
        if (topGenres != null && !topGenres.isEmpty()) {
          suggestions.suggestedGenres = topGenres.stream()
              .map(g -> g[0] != null ? (String) g[0] : null)
              .filter(genre -> genre != null)
              .limit(5)
              .collect(Collectors.toList());
        }
      } catch (Exception e) {
        // If query fails, just use empty list
        suggestions.suggestedGenres = List.of();
      }

      // Get recently viewed books (potential requests)
      try {
        List<UserBehaviorEntity> recentViews = behaviorRepository
            .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, BehaviorType.BOOK_VIEW);
        
        if (recentViews != null && !recentViews.isEmpty()) {
          // Get book details for recently viewed
          suggestions.recentlyViewedBooks = recentViews.stream()
              .map(UserBehaviorEntity::getBookId)
              .filter(bookId -> bookId != null)
              .distinct()
              .map(bookId -> bookRepository.findById(bookId).orElse(null))
              .filter(book -> book != null)
              .limit(5)
              .map(book -> new BookSuggestion(book.getTitle(), book.getAuthor(), book.getGenre()))
              .collect(Collectors.toList());
        }
      } catch (Exception e) {
        // If query fails, just use empty list
        suggestions.recentlyViewedBooks = List.of();
      }

      // Get most searched genres
      try {
        List<Object[]> topSearchedGenres = behaviorRepository.findTopCategories(userId);
        if (topSearchedGenres != null && !topSearchedGenres.isEmpty()) {
          suggestions.popularGenres = topSearchedGenres.stream()
              .map(g -> g[0] != null ? (String) g[0] : null)
              .filter(genre -> genre != null)
              .limit(10)
              .collect(Collectors.toList());
        }
      } catch (Exception e) {
        // If query fails, just use empty list
        suggestions.popularGenres = List.of();
      }
    } catch (Exception e) {
      // Return empty suggestions if anything fails
      suggestions.recentSearches = List.of();
      suggestions.suggestedGenres = List.of();
      suggestions.recentlyViewedBooks = List.of();
      suggestions.popularGenres = List.of();
    }

    return suggestions;
  }

  /**
   * Get quick suggestions based on partial input
   */
  public List<String> getQuickSuggestions(UUID userId, String partialQuery, String fieldType) {
    if (partialQuery == null || partialQuery.trim().isEmpty()) {
      return List.of();
    }

    String query = partialQuery.toLowerCase().trim();

    switch (fieldType) {
      case "title":
        // Search in recently viewed books
        return behaviorRepository
            .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, BehaviorType.BOOK_VIEW)
            .stream()
            .map(UserBehaviorEntity::getBookId)
            .filter(bookId -> bookId != null)
            .map(bookId -> bookRepository.findById(bookId).orElse(null))
            .filter(book -> book != null && book.getTitle().toLowerCase().contains(query))
            .map(BookEntity::getTitle)
            .distinct()
            .limit(5)
            .collect(Collectors.toList());

      case "author":
        return behaviorRepository
            .findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(userId, BehaviorType.BOOK_VIEW)
            .stream()
            .map(UserBehaviorEntity::getBookId)
            .filter(bookId -> bookId != null)
            .map(bookId -> bookRepository.findById(bookId).orElse(null))
            .filter(book -> book != null && book.getAuthor().toLowerCase().contains(query))
            .map(BookEntity::getAuthor)
            .distinct()
            .limit(5)
            .collect(Collectors.toList());

      case "genre":
        return behaviorRepository.findTopCategories(userId).stream()
            .map(g -> (String) g[0])
            .filter(genre -> genre != null && genre.toLowerCase().contains(query))
            .limit(5)
            .collect(Collectors.toList());

      default:
        return List.of();
    }
  }

  public static class AutoFillSuggestions {
    public List<String> recentSearches = List.of();
    public List<String> suggestedGenres = List.of();
    public List<BookSuggestion> recentlyViewedBooks = List.of();
    public List<String> popularGenres = List.of();
  }

  public static class BookSuggestion {
    public final String title;
    public final String author;
    public final String genre;

    public BookSuggestion(String title, String author, String genre) {
      this.title = title;
      this.author = author;
      this.genre = genre;
    }
  }
}

