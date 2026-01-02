package com.arka.modules.demand.service;

import com.arka.modules.demand.entity.BookRequestEntity;
import com.arka.modules.demand.repository.BookRequestRepository;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Service for matching book requests with available books
 * Implements smart matching algorithm similar to Uber/BlinkIt demand-driven model
 */
@Service
public class BookMatchingService {
  private final BookRequestRepository requestRepository;
  private final BookRepository bookRepository;

  public BookMatchingService(
      BookRequestRepository requestRepository,
      BookRepository bookRepository) {
    this.requestRepository = requestRepository;
    this.bookRepository = bookRepository;
  }

  /**
   * Find matching books for a specific request
   * Returns books sorted by match score (best matches first)
   */
  public List<BookMatchResult> findMatchesForRequest(UUID requestId) {
    BookRequestEntity request = requestRepository.findById(requestId).orElse(null);
    if (request == null || request.getStatus() != com.arka.modules.demand.entity.BookRequestStatus.OPEN) {
      return new ArrayList<>();
    }

    // Get all available books
    List<BookEntity> availableBooks = bookRepository.findAll().stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .filter(book -> !book.getOwnerId().equals(request.getRequesterId())) // Can't match own books
        .collect(Collectors.toList());

    // Score and rank matches
    List<BookMatchResult> matches = availableBooks.stream()
        .map(book -> calculateMatchScore(request, book))
        .filter(match -> match.getMatchScore() > 0) // Only return matches with some relevance
        .sorted(Comparator.comparing(BookMatchResult::getMatchScore).reversed())
        .collect(Collectors.toList());

    return matches;
  }

  /**
   * Find only exact matching books for a specific request
   * Returns books that match exactly (exact title + author, or exact ISBN)
   */
  public List<BookMatchResult> findExactMatchesForRequest(UUID requestId) {
    BookRequestEntity request = requestRepository.findById(requestId).orElse(null);
    if (request == null || request.getStatus() != com.arka.modules.demand.entity.BookRequestStatus.OPEN) {
      return new ArrayList<>();
    }

    // Get all available books
    List<BookEntity> availableBooks = bookRepository.findAll().stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .filter(book -> !book.getOwnerId().equals(request.getRequesterId())) // Can't match own books
        .collect(Collectors.toList());

    // Filter for exact matches only
    List<BookMatchResult> exactMatches = availableBooks.stream()
        .filter(book -> isExactMatch(request, book))
        .map(book -> calculateMatchScore(request, book))
        .sorted(Comparator.comparing(BookMatchResult::getMatchScore).reversed())
        .collect(Collectors.toList());

    return exactMatches;
  }

  /**
   * Check if a book is an exact match for a request
   * Exact match means:
   * - Exact ISBN match (if ISBN is provided in request) - most reliable
   * - OR exact title match AND exact author match (both required)
   */
  private boolean isExactMatch(BookRequestEntity request, BookEntity book) {
    // Check ISBN match first (most reliable) - if ISBN is provided, only match by ISBN
    if (request.getIsbn() != null && !request.getIsbn().trim().isEmpty()) {
      if (book.getIsbn() == null || book.getIsbn().trim().isEmpty()) {
        return false; // Request has ISBN but book doesn't - not a match
      }
      String requestIsbn = normalizeString(request.getIsbn());
      String bookIsbn = normalizeString(book.getIsbn());
      return requestIsbn.equals(bookIsbn);
    }

    // If no ISBN, require BOTH title AND author to match exactly
    // Both must be provided in the request
    if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
      return false; // No title in request - cannot match
    }
    if (request.getAuthor() == null || request.getAuthor().trim().isEmpty()) {
      return false; // No author in request - cannot match
    }
    if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
      return false; // Book has no title - cannot match
    }
    if (book.getAuthor() == null || book.getAuthor().trim().isEmpty()) {
      return false; // Book has no author - cannot match
    }

    // Normalize and compare both title and author
    String requestTitle = normalizeString(request.getTitle());
    String bookTitle = normalizeString(book.getTitle());
    String requestAuthor = normalizeString(request.getAuthor());
    String bookAuthor = normalizeString(book.getAuthor());

    // Both must match exactly
    return requestTitle.equals(bookTitle) && requestAuthor.equals(bookAuthor);
  }

  /**
   * Normalize string for exact matching:
   * - Convert to lowercase
   * - Trim whitespace
   * - Remove extra spaces (normalize multiple spaces to single space)
   */
  private String normalizeString(String str) {
    if (str == null) {
      return "";
    }
    return str.toLowerCase()
        .trim()
        .replaceAll("\\s+", " "); // Replace multiple spaces with single space
  }

  /**
   * Find matching requests for a seller's book
   * Returns only exact matches (exact title + author, or exact ISBN)
   */
  public List<RequestMatchResult> findMatchesForBook(UUID bookId, UUID sellerId) {
    BookEntity book = bookRepository.findById(bookId).orElse(null);
    if (book == null || !book.getOwnerId().equals(sellerId)) {
      return new ArrayList<>();
    }

    if (book.getStatus() != BookStatus.PUBLISHED) {
      return new ArrayList<>();
    }

    // Get all open requests
    List<BookRequestEntity> openRequests = requestRepository.findOpenRequests(
        java.time.Instant.now());

    // Filter for exact matches only
    List<RequestMatchResult> matches = openRequests.stream()
        .filter(request -> !request.getRequesterId().equals(sellerId)) // Can't match own requests
        .filter(request -> isExactMatch(request, book)) // Only exact matches
        .map(request -> calculateRequestMatchScore(request, book))
        .sorted(Comparator.comparing(RequestMatchResult::getMatchScore).reversed())
        .collect(Collectors.toList());

    return matches;
  }

  /**
   * Calculate match score between a request and a book
   * Score ranges from 0-100, higher is better
   */
  private BookMatchResult calculateMatchScore(BookRequestEntity request, BookEntity book) {
    double score = 0.0;
    List<String> matchReasons = new ArrayList<>();

    // Title match (40 points)
    if (request.getTitle() != null && book.getTitle() != null) {
      String requestTitle = request.getTitle().toLowerCase().trim();
      String bookTitle = book.getTitle().toLowerCase().trim();
      
      if (requestTitle.equals(bookTitle)) {
        score += 40;
        matchReasons.add("Exact title match");
      } else if (bookTitle.contains(requestTitle) || requestTitle.contains(bookTitle)) {
        score += 30;
        matchReasons.add("Partial title match");
      } else {
        // Fuzzy match using word similarity
        double similarity = calculateStringSimilarity(requestTitle, bookTitle);
        score += similarity * 20;
        if (similarity > 0.7) {
          matchReasons.add("Similar title");
        }
      }
    }

    // Author match (30 points)
    if (request.getAuthor() != null && book.getAuthor() != null) {
      String requestAuthor = request.getAuthor().toLowerCase().trim();
      String bookAuthor = book.getAuthor().toLowerCase().trim();
      
      if (requestAuthor.equals(bookAuthor)) {
        score += 30;
        matchReasons.add("Exact author match");
      } else if (bookAuthor.contains(requestAuthor) || requestAuthor.contains(bookAuthor)) {
        score += 20;
        matchReasons.add("Partial author match");
      }
    }

    // ISBN match (20 points) - exact match
    if (request.getIsbn() != null && book.getIsbn() != null) {
      if (request.getIsbn().trim().equalsIgnoreCase(book.getIsbn().trim())) {
        score += 20;
        matchReasons.add("ISBN match");
      }
    }

    // Genre match (10 points)
    if (request.getGenre() != null && book.getGenre() != null) {
      if (request.getGenre().equalsIgnoreCase(book.getGenre())) {
        score += 10;
        matchReasons.add("Genre match");
      }
    }

    // Price match (bonus/penalty)
    if (request.getMaxPrice() != null && book.getCreditPrice() != null) {
      if (book.getCreditPrice().compareTo(request.getMaxPrice()) <= 0) {
        score += 5; // Within budget
        matchReasons.add("Within budget");
      } else {
        score -= 10; // Over budget
      }
    }

    return new BookMatchResult(book, score, matchReasons);
  }

  /**
   * Calculate match score between a book and a request (reverse direction)
   */
  private RequestMatchResult calculateRequestMatchScore(BookRequestEntity request, BookEntity book) {
    BookMatchResult bookMatch = calculateMatchScore(request, book);
    return new RequestMatchResult(request, bookMatch.getMatchScore(), bookMatch.getMatchReasons());
  }

  /**
   * Simple string similarity using Levenshtein distance
   */
  private double calculateStringSimilarity(String s1, String s2) {
    if (s1 == null || s2 == null) return 0.0;
    if (s1.equals(s2)) return 1.0;
    
    int maxLength = Math.max(s1.length(), s2.length());
    if (maxLength == 0) return 1.0;
    
    int distance = levenshteinDistance(s1, s2);
    return 1.0 - ((double) distance / maxLength);
  }

  private int levenshteinDistance(String s1, String s2) {
    int[][] dp = new int[s1.length() + 1][s2.length() + 1];
    
    for (int i = 0; i <= s1.length(); i++) {
      for (int j = 0; j <= s2.length(); j++) {
        if (i == 0) {
          dp[i][j] = j;
        } else if (j == 0) {
          dp[i][j] = i;
        } else {
          dp[i][j] = Math.min(
              Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
              dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1)
          );
        }
      }
    }
    
    return dp[s1.length()][s2.length()];
  }

  /**
   * Result class for book matches
   */
  public static class BookMatchResult {
    private final BookEntity book;
    private final double matchScore;
    private final List<String> matchReasons;

    public BookMatchResult(BookEntity book, double matchScore, List<String> matchReasons) {
      this.book = book;
      this.matchScore = matchScore;
      this.matchReasons = matchReasons;
    }

    public BookEntity getBook() {
      return book;
    }

    public double getMatchScore() {
      return matchScore;
    }

    public List<String> getMatchReasons() {
      return matchReasons;
    }
  }

  /**
   * Result class for request matches
   */
  public static class RequestMatchResult {
    private final BookRequestEntity request;
    private final double matchScore;
    private final List<String> matchReasons;

    public RequestMatchResult(BookRequestEntity request, double matchScore, List<String> matchReasons) {
      this.request = request;
      this.matchScore = matchScore;
      this.matchReasons = matchReasons;
    }

    public BookRequestEntity getRequest() {
      return request;
    }

    public double getMatchScore() {
      return matchScore;
    }

    public List<String> getMatchReasons() {
      return matchReasons;
    }
  }
}

