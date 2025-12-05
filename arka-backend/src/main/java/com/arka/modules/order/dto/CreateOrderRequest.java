package com.arka.modules.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateOrderRequest(
    @NotEmpty(message = "Order items are required")
    List<OrderItemRequest> items,

    @NotNull(message = "Shipping address is required")
    String shippingAddress,

    String pickupTime,

    @NotNull(message = "Payment method is required")
    String paymentMethod,

    String contactPhone,

    String specialInstructions
) {
  public record OrderItemRequest(
      @NotNull(message = "Book ID is required")
      String bookId,

      @NotNull(message = "Quantity is required")
      Integer quantity
  ) {}
}

