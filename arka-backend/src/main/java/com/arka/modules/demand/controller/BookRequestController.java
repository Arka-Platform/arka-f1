package com.arka.modules.demand.controller;

import com.arka.common.result.Result;
import com.arka.modules.demand.dto.BookRequestResponse;
import com.arka.modules.demand.dto.CreateBookRequestRequest;
import com.arka.modules.demand.dto.CreateRequestResponse;
import com.arka.modules.demand.dto.FulfillRequestRequest;
import com.arka.modules.demand.dto.MatchResponse;
import com.arka.modules.demand.dto.RequestMatchResponse;
import com.arka.modules.demand.service.BookMatchingService;
import com.arka.modules.demand.service.BookRequestService;
import com.arka.modules.demand.service.RequestAutoFillService;
import com.arka.modules.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/demand")
public class BookRequestController {
  private final BookRequestService bookRequestService;
  private final BookMatchingService matchingService;
  private final RequestAutoFillService autoFillService;
  private final UserRepository userRepository;

  public BookRequestController(
      BookRequestService bookRequestService,
      BookMatchingService matchingService,
      RequestAutoFillService autoFillService,
      UserRepository userRepository) {
    this.bookRequestService = bookRequestService;
    this.matchingService = matchingService;
    this.autoFillService = autoFillService;
    this.userRepository = userRepository;
  }

  @PostMapping("/requests")
  public ResponseEntity<?> createRequest(
      @RequestBody CreateBookRequestRequest request,
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID requesterId = UUID.fromString(authenticatedUserId);
    Result<BookRequestResponse> result = bookRequestService.createRequest(requesterId, request);
    return switch (result) {
      case Result.Success<BookRequestResponse> success -> {
        // Immediately find exact matches for the newly created request
        BookRequestResponse createdRequest = success.value();
        UUID requestId = createdRequest.id();
        if (requestId == null) {
          yield ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid request ID"));
        }
        // Only show exact matches immediately after submission
        List<BookMatchingService.BookMatchResult> matches = matchingService.findExactMatchesForRequest(requestId);
        
        // Convert to MatchResponse DTOs
        List<MatchResponse> matchResponses = matches.stream()
            .map(match -> {
              var book = match.getBook();
              UUID ownerId = book.getOwnerId();
              // Skip matches where book has no owner (shouldn't happen, but safety check)
              if (ownerId == null) {
                return null;
              }
              var seller = userRepository.findById(ownerId).orElse(null);
              return new MatchResponse(
                  book.getId(),
                  book.getTitle(),
                  book.getAuthor(),
                  book.getGenre(),
                  book.getCreditPrice(),
                  book.getImageUrlMedium(),
                  ownerId, // Use validated ownerId
                  seller != null ? seller.getFirstName() + " " + seller.getLastName() : "Unknown",
                  match.getMatchScore(),
                  match.getMatchReasons()
              );
            })
            .filter(response -> response != null) // Filter out null responses
            .collect(Collectors.toList());
        
        // Return request with matches
        CreateRequestResponse response = new CreateRequestResponse(
            createdRequest,
            matchResponses,
            matchResponses.size()
        );
        yield ResponseEntity.ok(response);
      }
      case Result.Failure<BookRequestResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @GetMapping("/requests")
  public ResponseEntity<List<BookRequestResponse>> getOpenRequests(
      @RequestParam(required = false) String search) {
    if (search != null && !search.trim().isEmpty()) {
      return ResponseEntity.ok(bookRequestService.searchRequests(search.trim()));
    }
    return ResponseEntity.ok(bookRequestService.getOpenRequests());
  }

  @GetMapping("/requests/my")
  public ResponseEntity<List<BookRequestResponse>> getMyRequests(
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    return ResponseEntity.ok(bookRequestService.getUserRequests(userId));
  }

  @GetMapping("/requests/{requestId}")
  public ResponseEntity<?> getRequest(@PathVariable UUID requestId) {
    Result<BookRequestResponse> result = bookRequestService.getRequest(requestId);
    return switch (result) {
      case Result.Success<BookRequestResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<BookRequestResponse> failure -> 
          ResponseEntity.notFound().build();
    };
  }

  @PutMapping("/requests/{requestId}/fulfill")
  public ResponseEntity<?> fulfillRequest(
      @PathVariable UUID requestId,
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestBody FulfillRequestRequest fulfillRequest) {
    UUID sellerId = UUID.fromString(authenticatedUserId);
    Result<BookRequestResponse> result = bookRequestService.fulfillRequest(requestId, sellerId, fulfillRequest);
    return switch (result) {
      case Result.Success<BookRequestResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<BookRequestResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @DeleteMapping("/requests/{requestId}")
  public ResponseEntity<?> cancelRequest(
      @PathVariable UUID requestId,
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    Result<BookRequestResponse> result = bookRequestService.cancelRequest(requestId, userId);
    return switch (result) {
      case Result.Success<BookRequestResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<BookRequestResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  /**
   * Get matching books for a specific request
   * Only the requester can see matches for their own request
   */
  @GetMapping("/requests/{requestId}/matches")
  public ResponseEntity<?> getMatchesForRequest(
      @PathVariable UUID requestId,
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    // Verify that the user is the requester of this request
    Result<BookRequestResponse> requestResult = bookRequestService.getRequest(requestId);
    if (requestResult instanceof Result.Failure) {
      return ResponseEntity.notFound().build();
    }
    
    BookRequestResponse request = ((Result.Success<BookRequestResponse>) requestResult).value();
    if (!request.requesterId().equals(userId)) {
      return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
          .body(java.util.Map.of("error", "You can only view matches for your own requests"));
    }
    
    List<BookMatchingService.BookMatchResult> matches = matchingService.findExactMatchesForRequest(requestId);
    
    List<MatchResponse> response = matches.stream()
        .map(match -> {
          var book = match.getBook();
          UUID ownerId = book.getOwnerId();
          // Skip matches where book has no owner (shouldn't happen, but safety check)
          if (ownerId == null) {
            return null;
          }
          var seller = userRepository.findById(ownerId).orElse(null);
          return new MatchResponse(
              book.getId(),
              book.getTitle(),
              book.getAuthor(),
              book.getGenre(),
              book.getCreditPrice(),
              book.getImageUrlMedium(),
              ownerId, // Use validated ownerId
              seller != null ? seller.getFirstName() + " " + seller.getLastName() : "Unknown",
              match.getMatchScore(),
              match.getMatchReasons()
          );
        })
        .filter(matchResponse -> matchResponse != null) // Filter out null responses
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(response);
  }

  /**
   * Get matching requests for a seller's book
   */
  @GetMapping("/books/{bookId}/matches")
  public ResponseEntity<List<RequestMatchResponse>> getMatchesForBook(
      @PathVariable UUID bookId,
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID sellerId = UUID.fromString(authenticatedUserId);
    List<BookMatchingService.RequestMatchResult> matches = matchingService.findMatchesForBook(bookId, sellerId);
    
    List<RequestMatchResponse> response = matches.stream()
        .map(match -> {
          var request = match.getRequest();
          return new RequestMatchResponse(
              request.getId(),
              request.getTitle(),
              request.getAuthor(),
              request.getGenre(),
              request.getMaxPrice(),
              request.getUrgency(),
              request.getLocation(),
              request.getViewsCount(),
              match.getMatchScore(),
              match.getMatchReasons()
          );
        })
        .collect(Collectors.toList());
    
    return ResponseEntity.ok(response);
  }

  /**
   * Get auto-fill suggestions for creating a request
   */
  @GetMapping("/requests/autofill")
  public ResponseEntity<RequestAutoFillService.AutoFillSuggestions> getAutoFillSuggestions(
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    return ResponseEntity.ok(autoFillService.getAutoFillSuggestions(userId));
  }

  /**
   * Get quick suggestions for a field
   */
  @GetMapping("/requests/suggestions")
  public ResponseEntity<List<String>> getQuickSuggestions(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam String query,
      @RequestParam String fieldType) {
    UUID userId = UUID.fromString(authenticatedUserId);
    return ResponseEntity.ok(autoFillService.getQuickSuggestions(userId, query, fieldType));
  }

  /**
   * Get recently served (fulfilled/completed) requests for carousel
   */
  @GetMapping("/requests/recently-served")
  public ResponseEntity<List<BookRequestResponse>> getRecentlyServedRequests(
      @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(bookRequestService.getRecentlyServedRequests(limit));
  }

  /**
   * Get weekly statistics
   */
  @GetMapping("/requests/stats/weekly")
  public ResponseEntity<BookRequestService.WeeklyStats> getWeeklyStats() {
    return ResponseEntity.ok(bookRequestService.getWeeklyStats());
  }

  /**
   * Get most requested books
   */
  @GetMapping("/requests/most-requested")
  public ResponseEntity<List<BookRequestService.MostRequestedBook>> getMostRequestedBooks(
      @RequestParam(defaultValue = "5") int limit) {
    return ResponseEntity.ok(bookRequestService.getMostRequestedBooks(limit));
  }
}

