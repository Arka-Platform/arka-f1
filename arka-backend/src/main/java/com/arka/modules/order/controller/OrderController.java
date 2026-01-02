package com.arka.modules.order.controller;

import com.arka.common.result.Result;
import com.arka.modules.order.dto.CreateOrderRequest;
import com.arka.modules.order.dto.OrderResponse;
import com.arka.modules.order.dto.OrderTrackingResponse;
import com.arka.modules.order.entity.OrderStatus;
import com.arka.modules.order.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
  private final OrderService orderService;

  public OrderController(OrderService orderService) {
    this.orderService = orderService;
  }

  @PostMapping
  public ResponseEntity<?> createOrder(
      @Valid @RequestBody CreateOrderRequest request,
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }

    Result<OrderResponse> result = orderService.createOrder(userId, request);
    return switch (result) {
      case Result.Success<OrderResponse> success ->
          ResponseEntity.status(HttpStatus.CREATED).body(success.value());
      case Result.Failure<OrderResponse> failure ->
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  @GetMapping("/my")
  public ResponseEntity<List<OrderResponse>> getMyOrders(
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }

    List<OrderResponse> orders = orderService.getUserOrders(userId);
    return ResponseEntity.ok(orders);
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getOrderById(
      @PathVariable UUID id,
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }

    try {
      OrderResponse order = orderService.getOrderById(id, userId);
      return ResponseEntity.ok(order);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/{id}/tracking")
  public ResponseEntity<?> getOrderTracking(
      @PathVariable UUID id,
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }

    try {
      OrderTrackingResponse tracking = orderService.getOrderTracking(id, userId);
      return ResponseEntity.ok(tracking);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> cancelOrder(
      @PathVariable UUID id,
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }

    Result<OrderResponse> result = orderService.cancelOrder(id, userId);
    return switch (result) {
      case Result.Success<OrderResponse> success -> ResponseEntity.ok(success.value());
      case Result.Failure<OrderResponse> failure ->
          ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<?> updateOrderStatus(
      @PathVariable UUID id,
      @RequestParam String status,
      @RequestParam(required = false) UUID userId) {
    // For now, accept userId as parameter. In production, get from authenticated user context
    if (userId == null) {
      userId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    }

    try {
      OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
      Result<OrderResponse> result = orderService.updateOrderStatus(id, userId, newStatus);
      return switch (result) {
        case Result.Success<OrderResponse> success -> ResponseEntity.ok(success.value());
        case Result.Failure<OrderResponse> failure ->
            ResponseEntity.badRequest().body(Map.of("error", failure.message()));
      };
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
    }
  }
}





