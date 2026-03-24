package com.arka.modules.bookshelf.controller;

import com.arka.common.result.Result;
import com.arka.modules.bookshelf.dto.AddToBookshelfRequest;
import com.arka.modules.bookshelf.dto.BookshelfItemResponse;
import com.arka.modules.bookshelf.service.BookshelfService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookshelf")
public class BookshelfController {
  private final BookshelfService bookshelfService;

  public BookshelfController(BookshelfService bookshelfService) {
    this.bookshelfService = bookshelfService;
  }

  @GetMapping
  public ResponseEntity<List<BookshelfItemResponse>> getBookshelf(@AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    return ResponseEntity.ok(bookshelfService.getBookshelf(userId));
  }

  @PostMapping
  public ResponseEntity<?> addToBookshelf(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam UUID bookId,
      @RequestBody(required = false) AddToBookshelfRequest request) {
    UUID userId = UUID.fromString(authenticatedUserId);
    Result<BookshelfItemResponse> result = bookshelfService.addToBookshelf(userId, bookId, request);
    return switch (result) {
      case Result.Success<BookshelfItemResponse> success ->
          ResponseEntity.ok(success.value());
      case Result.Failure<BookshelfItemResponse> failure ->
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  @DeleteMapping("/{bookId}")
  public ResponseEntity<?> removeFromBookshelf(
      @PathVariable UUID bookId,
      @AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    Result<Void> result = bookshelfService.removeFromBookshelf(userId, bookId);
    return switch (result) {
      case Result.Success<Void> success ->
          ResponseEntity.noContent().build();
      case Result.Failure<Void> failure ->
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  @GetMapping("/check")
  public ResponseEntity<Map<String, Boolean>> checkInBookshelf(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam UUID bookId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    boolean isInBookshelf = bookshelfService.isInBookshelf(userId, bookId);
    return ResponseEntity.ok(Map.of("isInBookshelf", isInBookshelf));
  }

  @GetMapping("/count")
  public ResponseEntity<Map<String, Integer>> getBookshelfCount(@AuthenticationPrincipal String authenticatedUserId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    int count = bookshelfService.getBookshelfCount(userId);
    return ResponseEntity.ok(Map.of("count", count));
  }
}


