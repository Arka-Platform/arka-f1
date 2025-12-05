package com.arka.modules.marketplace.controller;

import com.arka.common.result.Result;
import com.arka.modules.marketplace.dto.CreateExchangeRequest;
import com.arka.modules.marketplace.dto.ExchangeResponse;
import com.arka.modules.marketplace.service.ExchangeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/exchanges")
public class ExchangeController {
  private final ExchangeService exchangeService;

  public ExchangeController(ExchangeService exchangeService) {
    this.exchangeService = exchangeService;
  }

  /**
   * Create a new book exchange
   * POST /api/v1/exchanges
   */
  @PostMapping
  public ResponseEntity<?> createExchange(
      @RequestBody @Valid CreateExchangeRequest request,
      @RequestParam(required = false) UUID buyerId) {
    // For now, accept buyerId as parameter. In production, get from authenticated user context
    if (buyerId == null) {
      buyerId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }
    
    Result<ExchangeResponse> result = exchangeService.createExchange(request.bookId(), buyerId);
    return switch (result) {
      case Result.Success<ExchangeResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<ExchangeResponse> failure -> 
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  /**
   * Get user's exchanges
   * GET /api/v1/exchanges/my
   */
  @GetMapping("/my")
  public ResponseEntity<List<ExchangeResponse>> getMyExchanges(
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }
    
    List<ExchangeResponse> exchanges = exchangeService.getUserExchanges(userId);
    return ResponseEntity.ok(exchanges);
  }

  /**
   * Get exchanges for a specific book
   * GET /api/v1/exchanges/book/{bookId}
   */
  @GetMapping("/book/{bookId}")
  public ResponseEntity<List<ExchangeResponse>> getBookExchanges(
      @PathVariable UUID bookId) {
    List<ExchangeResponse> exchanges = exchangeService.getBookExchanges(bookId);
    return ResponseEntity.ok(exchanges);
  }

  /**
   * Confirm an exchange (seller confirms)
   * PUT /api/v1/exchanges/{exchangeId}/confirm
   */
  @PutMapping("/{exchangeId}/confirm")
  public ResponseEntity<?> confirmExchange(
      @PathVariable UUID exchangeId,
      @RequestParam(required = false) UUID sellerId) {
    // For now, accept sellerId as parameter. In production, get from authenticated user context
    if (sellerId == null) {
      sellerId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }
    
    Result<ExchangeResponse> result = exchangeService.confirmExchange(exchangeId, sellerId);
    return switch (result) {
      case Result.Success<ExchangeResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<ExchangeResponse> failure -> 
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  /**
   * Complete an exchange (buyer confirms receipt)
   * PUT /api/v1/exchanges/{exchangeId}/complete
   */
  @PutMapping("/{exchangeId}/complete")
  public ResponseEntity<?> completeExchange(
      @PathVariable UUID exchangeId,
      @RequestParam(required = false) UUID buyerId) {
    // For now, accept buyerId as parameter. In production, get from authenticated user context
    if (buyerId == null) {
      buyerId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }
    
    Result<ExchangeResponse> result = exchangeService.completeExchange(exchangeId, buyerId);
    return switch (result) {
      case Result.Success<ExchangeResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<ExchangeResponse> failure -> 
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  /**
   * Cancel an exchange
   * DELETE /api/v1/exchanges/{exchangeId}
   */
  @DeleteMapping("/{exchangeId}")
  public ResponseEntity<?> cancelExchange(
      @PathVariable UUID exchangeId,
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }
    
    Result<ExchangeResponse> result = exchangeService.cancelExchange(exchangeId, userId);
    return switch (result) {
      case Result.Success<ExchangeResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<ExchangeResponse> failure -> 
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  /**
   * Get service fee calculation for a book
   * GET /api/v1/exchanges/fee?bookPrice={price}
   */
  @GetMapping("/fee")
  public ResponseEntity<Map<String, Object>> calculateFee(
      @RequestParam java.math.BigDecimal bookPrice) {
    java.math.BigDecimal serviceFee = exchangeService.calculateServiceFee(bookPrice);
    java.math.BigDecimal totalCost = bookPrice.add(serviceFee);
    
    return ResponseEntity.ok(Map.of(
        "bookPrice", bookPrice,
        "serviceFee", serviceFee,
        "totalCost", totalCost,
        "serviceFeePercentage", "10%"
    ));
  }
}










