package com.arka.modules.marketplace.controller;

import com.arka.common.result.Result;
import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.dto.CreateBookRequest;
import com.arka.modules.marketplace.service.BookService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/books")
public class BookController {
  private final BookService bookService;

  public BookController(BookService bookService) {
    this.bookService = bookService;
  }

  @PostMapping
  public ResponseEntity<?> create(@RequestBody @Valid CreateBookRequest request) {
    Result<UUID> result = bookService.createBook(request);
    return switch (result) {
      case Result.Success<UUID> success -> ResponseEntity.ok(Map.of("id", success.value()));
      case Result.Failure<UUID> failure -> ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  @GetMapping
  public ResponseEntity<List<BookResponse>> list(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String genre,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    if (search != null && !search.trim().isEmpty()) {
      return ResponseEntity.ok(bookService.searchBooks(search.trim()));
    }
    if (genre != null && !genre.trim().isEmpty()) {
      return ResponseEntity.ok(bookService.listBooksByGenre(genre.trim()));
    }
    return ResponseEntity.ok(bookService.listBooks(page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getById(@PathVariable java.util.UUID id) {
    return bookService.getBookById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable java.util.UUID id,
      @RequestBody @Valid CreateBookRequest request) {
    Result<BookResponse> result = bookService.updateBook(id, request);
    return switch (result) {
      case Result.Success<BookResponse> success -> ResponseEntity.ok(success.value());
      case Result.Failure<BookResponse> failure -> ResponseEntity.badRequest()
          .body(Map.of("error", failure.message()));
    };
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable java.util.UUID id) {
    Result<Void> result = bookService.deleteBook(id);
    return switch (result) {
      case Result.Success<Void> success -> ResponseEntity.noContent().build();
      case Result.Failure<Void> failure -> ResponseEntity.badRequest()
          .body(Map.of("error", failure.message()));
    };
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<?> updateStatus(
      @PathVariable java.util.UUID id,
      @RequestParam String status) {
    Result<BookResponse> result = bookService.updateBookStatus(id, status);
    return switch (result) {
      case Result.Success<BookResponse> success -> ResponseEntity.ok(success.value());
      case Result.Failure<BookResponse> failure -> ResponseEntity.badRequest()
          .body(Map.of("error", failure.message()));
    };
  }

  @GetMapping("/my")
  public ResponseEntity<List<BookResponse>> getMyBooks(
      @RequestParam(required = false) UUID ownerId) {
    // For now, accept ownerId as parameter. In production, get from authenticated user context
    if (ownerId == null) {
      ownerId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }
    return ResponseEntity.ok(bookService.getBooksByOwner(ownerId));
  }
}











