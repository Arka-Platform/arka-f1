package com.arka.modules.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    UUID userId,
    List<OrderItemResponse> items,
    BigDecimal totalAmount,
    BigDecimal pickupFee,
    String status,
    String shippingAddress,
    String pickupTime,
    String paymentMethod,
    String contactPhone,
    String specialInstructions,
    String trackingNumber,
    Instant createdAt,
    Instant updatedAt  // Can be null
) {
  public record OrderItemResponse(
      UUID id,
      UUID bookId,
      String bookTitle,
      String bookAuthor,
      Integer quantity,
      BigDecimal unitPrice,
      BigDecimal subtotal
  ) {}
}

