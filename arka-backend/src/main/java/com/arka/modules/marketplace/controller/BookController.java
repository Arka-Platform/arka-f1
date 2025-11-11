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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
  public ResponseEntity<List<BookResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
    return ResponseEntity.ok(bookService.listBooks(page, size));
  }
}

