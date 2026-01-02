package com.arka.modules.demand.service;

import com.arka.common.result.Result;
import com.arka.modules.demand.dto.BookRequestResponse;
import com.arka.modules.demand.dto.CreateBookRequestRequest;
import com.arka.modules.demand.dto.FulfillRequestRequest;
import com.arka.modules.demand.entity.BookRequestEntity;
import com.arka.modules.demand.entity.BookRequestStatus;
import com.arka.modules.demand.repository.BookRequestRepository;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookRequestService {
  private final BookRequestRepository requestRepository;
  private final BookRepository bookRepository;
  private final UserRepository userRepository;
  private final com.arka.modules.trustscore.service.TrustScoreService trustScoreService;

  public BookRequestService(
      BookRequestRepository requestRepository,
      BookRepository bookRepository,
      UserRepository userRepository,
      com.arka.modules.trustscore.service.TrustScoreService trustScoreService) {
    this.requestRepository = requestRepository;
    this.bookRepository = bookRepository;
    this.userRepository = userRepository;
    this.trustScoreService = trustScoreService;
  }

  /**
   * Create a new book request
   */
  @Transactional
  public Result<BookRequestResponse> createRequest(UUID requesterId, CreateBookRequestRequest request) {
    try {
      // Validate user exists before creating request
      UserEntity requester = userRepository.findById(requesterId).orElse(null);
      if (requester == null) {
        return Result.failure("User not found with ID: " + requesterId);
      }

      if (request.title() == null || request.title().trim().isEmpty()) {
        return Result.failure("Book title is required");
      }
      if (request.author() == null || request.author().trim().isEmpty()) {
        return Result.failure("Book author is required");
      }

      BookRequestEntity entity = new BookRequestEntity(requesterId, request.title().trim(), request.author().trim());
      
      if (request.description() != null && !request.description().trim().isEmpty()) {
        entity.setDescription(request.description().trim());
      }
      if (request.genre() != null && !request.genre().trim().isEmpty()) {
        entity.setGenre(request.genre().trim());
      }
      if (request.category() != null && !request.category().trim().isEmpty()) {
        entity.setCategory(request.category().trim());
      }
      if (request.subcategory() != null && !request.subcategory().trim().isEmpty()) {
        entity.setSubcategory(request.subcategory().trim());
      }
      if (request.isbn() != null && !request.isbn().trim().isEmpty()) {
        entity.setIsbn(request.isbn().trim());
      }
      if (request.maxPrice() != null) {
        entity.setMaxPrice(request.maxPrice());
      }
      if (request.preferredCondition() != null && !request.preferredCondition().trim().isEmpty()) {
        entity.setPreferredCondition(request.preferredCondition().trim());
      }
      if (request.urgency() != null && !request.urgency().trim().isEmpty()) {
        entity.setUrgency(request.urgency().trim());
      }
      if (request.location() != null && !request.location().trim().isEmpty()) {
        entity.setLocation(request.location().trim());
      }
      if (request.additionalNotes() != null && !request.additionalNotes().trim().isEmpty()) {
        entity.setAdditionalNotes(request.additionalNotes().trim());
      }
      if (request.expiresAt() != null) {
        entity.setExpiresAt(request.expiresAt());
      } else {
        // Default: expire after 30 days
        entity.setExpiresAt(Instant.now().plusSeconds(30 * 24 * 60 * 60));
      }

      entity.setStatus(BookRequestStatus.OPEN);
      
      try {
        entity = requestRepository.save(entity);
      } catch (org.springframework.dao.DataIntegrityViolationException e) {
        // Check if it's a foreign key constraint violation
        String errorMsg = e.getMessage();
        if (errorMsg != null && (errorMsg.contains("foreign key") || errorMsg.contains("constraint"))) {
          return Result.failure("Invalid user ID. The specified user does not exist.");
        }
        throw e;
      } catch (org.springframework.dao.DataAccessException e) {
        // Check if it's a table doesn't exist error
        String errorMsg = e.getMessage();
        if (errorMsg != null && (errorMsg.contains("does not exist") || errorMsg.contains("relation") || errorMsg.contains("table"))) {
          return Result.failure("Database table 'book_requests' does not exist. Please restart the backend to run migrations.");
        }
        throw e;
      }
      return Result.success(toResponse(entity, requester, null));
    } catch (Exception e) {
      // Log the error for debugging
      System.err.println("Error creating book request: " + e.getMessage());
      e.printStackTrace();
      String errorMsg = e.getMessage();
      if (errorMsg != null && (errorMsg.contains("does not exist") || errorMsg.contains("relation") || errorMsg.contains("table"))) {
        return Result.failure("Database table 'book_requests' does not exist. Please restart the backend to run migrations.");
      }
      return Result.failure("Failed to create book request: " + (errorMsg != null ? errorMsg : "Unknown error"));
    }
  }

  /**
   * Get all open book requests
   */
  public List<BookRequestResponse> getOpenRequests() {
    try {
      List<BookRequestEntity> requests = requestRepository.findOpenRequests(Instant.now());
      if (requests == null) {
        return List.of();
      }
      return requests.stream()
          .map(req -> {
            UserEntity requester = userRepository.findById(req.getRequesterId()).orElse(null);
            UserEntity fulfiller = req.getFulfilledBy() != null 
                ? userRepository.findById(req.getFulfilledBy()).orElse(null) 
                : null;
            return toResponse(req, requester, fulfiller);
          })
          .collect(Collectors.toList());
    } catch (Exception e) {
      // If table doesn't exist or query fails, return empty list
      return List.of();
    }
  }

  /**
   * Get user's book requests
   */
  public List<BookRequestResponse> getUserRequests(UUID userId) {
    try {
      List<BookRequestEntity> requests = requestRepository.findByRequesterIdOrderByCreatedAtDesc(userId);
      if (requests == null) {
        return List.of();
      }
      return requests.stream()
          .map(req -> {
            UserEntity requester = userRepository.findById(req.getRequesterId()).orElse(null);
            UserEntity fulfiller = req.getFulfilledBy() != null 
                ? userRepository.findById(req.getFulfilledBy()).orElse(null) 
                : null;
            return toResponse(req, requester, fulfiller);
          })
          .collect(Collectors.toList());
    } catch (Exception e) {
      // If table doesn't exist or query fails, return empty list
      System.err.println("Error loading user requests: " + e.getMessage());
      e.printStackTrace();
      return List.of();
    }
  }

  /**
   * Get book request by ID
   */
  public Result<BookRequestResponse> getRequest(UUID requestId) {
    BookRequestEntity request = requestRepository.findById(requestId).orElse(null);
    if (request == null) {
      return Result.failure("Book request not found");
    }

    // Increment view count
    request.incrementViews();
    request = requestRepository.save(request);

    UserEntity requester = userRepository.findById(request.getRequesterId()).orElse(null);
    UserEntity fulfiller = request.getFulfilledBy() != null 
        ? userRepository.findById(request.getFulfilledBy()).orElse(null) 
        : null;
    return Result.success(toResponse(request, requester, fulfiller));
  }

  /**
   * Fulfill a book request (seller commits to fulfill)
   */
  @Transactional
  public Result<BookRequestResponse> fulfillRequest(UUID requestId, UUID sellerId, FulfillRequestRequest fulfillRequest) {
    // Validate sellerId is not null and valid
    if (sellerId == null) {
      return Result.failure("Seller ID is required");
    }
    
    // Verify seller exists
    UserEntity seller = userRepository.findById(sellerId).orElse(null);
    if (seller == null) {
      return Result.failure("Seller not found with ID: " + sellerId);
    }

    BookRequestEntity request = requestRepository.findById(requestId).orElse(null);
    if (request == null) {
      return Result.failure("Book request not found");
    }

    if (request.getStatus() != BookRequestStatus.OPEN) {
      return Result.failure("This request is no longer open");
    }

    // Check if request has expired
    if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(Instant.now())) {
      request.setStatus(BookRequestStatus.EXPIRED);
      requestRepository.save(request);
      return Result.failure("This request has expired");
    }

    // Verify the book exists and belongs to seller
    BookEntity book = bookRepository.findById(fulfillRequest.bookId()).orElse(null);
    if (book == null) {
      return Result.failure("Book not found");
    }
    if (!book.getOwnerId().equals(sellerId)) {
      return Result.failure("You don't own this book");
    }

    // Cannot fulfill your own request
    if (request.getRequesterId().equals(sellerId)) {
      return Result.failure("Cannot fulfill your own request");
    }

    // Update request - ensure sellerId is valid before setting
    request.setStatus(BookRequestStatus.FULFILLED);
    request.setFulfilledBy(sellerId); // sellerId is validated above
    Instant fulfilledAt = Instant.now();
    request.setFulfilledAt(fulfilledAt);
    request = requestRepository.save(request);

    // Track trust score: response time
    trustScoreService.recordResponseTime(sellerId, request.getCreatedAt(), fulfilledAt);

    UserEntity requester = userRepository.findById(request.getRequesterId()).orElse(null);
    UserEntity fulfiller = userRepository.findById(sellerId).orElse(null);
    return Result.success(toResponse(request, requester, fulfiller));
  }

  /**
   * Cancel a book request
   */
  @Transactional
  public Result<BookRequestResponse> cancelRequest(UUID requestId, UUID userId) {
    BookRequestEntity request = requestRepository.findById(requestId).orElse(null);
    if (request == null) {
      return Result.failure("Book request not found");
    }

    if (!request.getRequesterId().equals(userId)) {
      return Result.failure("You can only cancel your own requests");
    }

    if (request.getStatus() != BookRequestStatus.OPEN) {
      return Result.failure("Only open requests can be cancelled");
    }

    request.setStatus(BookRequestStatus.CANCELLED);
    request = requestRepository.save(request);

    UserEntity requester = userRepository.findById(request.getRequesterId()).orElse(null);
    UserEntity fulfiller = request.getFulfilledBy() != null 
        ? userRepository.findById(request.getFulfilledBy()).orElse(null) 
        : null;
    return Result.success(toResponse(request, requester, fulfiller));
  }

  /**
   * Search book requests
   */
  public List<BookRequestResponse> searchRequests(String query) {
    List<BookRequestEntity> requests = requestRepository.search(query.trim());
    return requests.stream()
        .filter(req -> req.getStatus() == BookRequestStatus.OPEN)
        .map(req -> {
          UserEntity requester = userRepository.findById(req.getRequesterId()).orElse(null);
          return toResponse(req, requester, null);
        })
        .collect(Collectors.toList());
  }

  /**
   * Get recently served (fulfilled/completed) requests
   */
  public List<BookRequestResponse> getRecentlyServedRequests(int limit) {
    try {
      List<BookRequestEntity> requests = requestRepository.findRecentlyServedRequests();
      if (requests == null) {
        return List.of();
      }
      return requests.stream()
          .limit(limit)
          .map(req -> {
            UserEntity requester = userRepository.findById(req.getRequesterId()).orElse(null);
            UserEntity fulfiller = req.getFulfilledBy() != null 
                ? userRepository.findById(req.getFulfilledBy()).orElse(null) 
                : null;
            return toResponse(req, requester, fulfiller);
          })
          .collect(Collectors.toList());
    } catch (Exception e) {
      return List.of();
    }
  }

  /**
   * Get weekly statistics for requests
   */
  public WeeklyStats getWeeklyStats() {
    try {
      Instant weekAgo = Instant.now().minusSeconds(7 * 24 * 60 * 60);
      
      Long openRequests = requestRepository.countOpenRequests();
      Long completedThisWeek = requestRepository.countCompletedRequestsSince(weekAgo);
      Long createdThisWeek = requestRepository.countRequestsCreatedSince(weekAgo);
      
      return new WeeklyStats(
          openRequests != null ? openRequests.intValue() : 0,
          completedThisWeek != null ? completedThisWeek.intValue() : 0,
          createdThisWeek != null ? createdThisWeek.intValue() : 0
      );
    } catch (Exception e) {
      return new WeeklyStats(0, 0, 0);
    }
  }

  /**
   * Get the most requested book(s)
   * Returns a list of the most requested books with their request counts
   */
  public List<MostRequestedBook> getMostRequestedBooks(int limit) {
    try {
      org.springframework.data.domain.Pageable pageable = 
          org.springframework.data.domain.PageRequest.of(0, limit);
      
      List<Object[]> results = requestRepository.findMostRequestedBooks(pageable);
      
      return results.stream()
          .map(result -> {
            String title = (String) result[0];
            String author = (String) result[1];
            Long count = ((Number) result[2]).longValue();
            return new MostRequestedBook(title, author, count);
          })
          .collect(java.util.stream.Collectors.toList());
    } catch (Exception e) {
      // Return empty list if query fails
      return java.util.Collections.emptyList();
    }
  }

  /**
   * Weekly statistics DTO
   */
  public record WeeklyStats(
      int openRequests,
      int completedThisWeek,
      int createdThisWeek
  ) {}

  /**
   * Most requested book DTO
   */
  public record MostRequestedBook(
      String title,
      String author,
      Long requestCount
  ) {}

  private BookRequestResponse toResponse(BookRequestEntity request, UserEntity requester, UserEntity fulfiller) {
    return new BookRequestResponse(
        request.getId(),
        request.getRequesterId(),
        requester != null ? requester.getFirstName() + " " + requester.getLastName() : "Unknown",
        requester != null ? requester.getEmail() : null,
        request.getTitle(),
        request.getAuthor(),
        request.getDescription(),
        request.getGenre(),
        request.getCategory(),
        request.getSubcategory(),
        request.getIsbn(),
        request.getMaxPrice(),
        request.getPreferredCondition(),
        request.getUrgency(),
        request.getLocation(),
        request.getAdditionalNotes(),
        request.getStatus() != null ? request.getStatus() : BookRequestStatus.OPEN,
        request.getExpiresAt(),
        request.getFulfilledBy(),
        fulfiller != null ? fulfiller.getFirstName() + " " + fulfiller.getLastName() : null,
        request.getFulfilledAt(),
        request.getViewsCount() != null ? request.getViewsCount() : 0,
        request.getOffersCount() != null ? request.getOffersCount() : 0,
        request.getCreatedAt() != null ? request.getCreatedAt() : Instant.now(),
        Instant.now() // In real app, this would be updatedAt from entity
    );
  }
}

