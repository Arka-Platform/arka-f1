package com.arka.modules.order.service;

import com.arka.common.exception.ResourceNotFoundException;
import com.arka.common.result.Result;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.order.dto.CreateOrderRequest;
import com.arka.modules.order.dto.OrderResponse;
import com.arka.modules.order.dto.OrderTrackingResponse;
import com.arka.modules.order.entity.OrderEntity;
import com.arka.modules.order.entity.OrderItemEntity;
import com.arka.modules.order.entity.OrderStatus;
import com.arka.modules.order.repository.OrderRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
  private final OrderRepository orderRepository;
  private final BookRepository bookRepository;

  public OrderService(OrderRepository orderRepository, BookRepository bookRepository) {
    this.orderRepository = orderRepository;
    this.bookRepository = bookRepository;
  }

  @Transactional
  public Result<OrderResponse> createOrder(UUID userId, CreateOrderRequest request) {
    try {
      BigDecimal subtotal = BigDecimal.ZERO;
      List<OrderItemEntity> items = new ArrayList<>();

      // Validate and create order items
      for (CreateOrderRequest.OrderItemRequest itemRequest : request.items()) {
        UUID bookId = UUID.fromString(itemRequest.bookId());
        BookEntity book = bookRepository.findById(bookId)
            .orElseThrow(() -> new IllegalArgumentException("Book not found: " + itemRequest.bookId()));

        BigDecimal unitPrice = book.getCreditPrice();
        BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.quantity()));
        subtotal = subtotal.add(itemSubtotal);

        OrderItemEntity item = new OrderItemEntity(bookId, itemRequest.quantity(), unitPrice);
        items.add(item);
      }

      BigDecimal pickupFee = BigDecimal.ONE; // Default pickup fee
      BigDecimal totalAmount = subtotal.add(pickupFee);

      OrderEntity order = new OrderEntity(userId, totalAmount, pickupFee);
      order.setShippingAddress(request.shippingAddress());
      order.setPickupTime(request.pickupTime());
      order.setPaymentMethod(request.paymentMethod());
      order.setContactPhone(request.contactPhone());
      order.setSpecialInstructions(request.specialInstructions());
      order.setStatus(OrderStatus.PENDING);
      order.setTrackingNumber(generateTrackingNumber());

      // Add items to order
      for (OrderItemEntity item : items) {
        order.addItem(item);
      }

      OrderEntity saved = orderRepository.save(order);
      return Result.success(toResponse(saved));
    } catch (Exception e) {
      return Result.failure("Failed to create order: " + e.getMessage());
    }
  }

  public List<OrderResponse> getUserOrders(UUID userId) {
    return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  public OrderResponse getOrderById(UUID orderId, UUID userId) {
    OrderEntity order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

    if (!order.getUserId().equals(userId)) {
      throw new IllegalArgumentException("Access denied");
    }

    return toResponse(order);
  }

  public OrderTrackingResponse getOrderTracking(UUID orderId, UUID userId) {
    OrderEntity order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

    if (!order.getUserId().equals(userId)) {
      throw new IllegalArgumentException("Access denied");
    }

    return toTrackingResponse(order);
  }

  private OrderResponse toResponse(OrderEntity order) {
    List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
        .map(item -> {
          BookEntity book = bookRepository.findById(item.getBookId()).orElse(null);
          return new OrderResponse.OrderItemResponse(
              item.getId(),
              item.getBookId(),
              book != null ? book.getTitle() : "Unknown Book",
              book != null ? book.getAuthor() : "Unknown Author",
              item.getQuantity(),
              item.getUnitPrice(),
              item.getSubtotal()
          );
        })
        .collect(Collectors.toList());

    return new OrderResponse(
        order.getId(),
        order.getUserId(),
        items,
        order.getTotalAmount(),
        order.getPickupFee(),
        order.getStatus().name(),
        order.getShippingAddress(),
        order.getPickupTime(),
        order.getPaymentMethod(),
        order.getContactPhone(),
        order.getSpecialInstructions(),
        order.getTrackingNumber(),
        order.getCreatedAt(),
        order.getUpdatedAt()
    );
  }

  private OrderTrackingResponse toTrackingResponse(OrderEntity order) {
    List<OrderTrackingResponse.TrackingStep> steps = generateTrackingSteps(order);
    Instant estimatedDelivery = order.getCreatedAt().plusSeconds(5 * 24 * 60 * 60); // 5 days from order

    return new OrderTrackingResponse(
        order.getId().toString(),
        order.getTrackingNumber(),
        order.getStatus().name(),
        steps,
        estimatedDelivery
    );
  }

  private List<OrderTrackingResponse.TrackingStep> generateTrackingSteps(OrderEntity order) {
    List<OrderTrackingResponse.TrackingStep> steps = new ArrayList<>();
    Instant baseTime = order.getCreatedAt();

    steps.add(new OrderTrackingResponse.TrackingStep(
        "1", "Order Placed", "Your order has been received",
        baseTime, true));

    if (order.getStatus().ordinal() >= OrderStatus.CONFIRMED.ordinal()) {
      steps.add(new OrderTrackingResponse.TrackingStep(
          "2", "Confirmed", "Your order has been confirmed",
          baseTime.plusSeconds(3600), true));
    }

    if (order.getStatus().ordinal() >= OrderStatus.PROCESSING.ordinal()) {
      steps.add(new OrderTrackingResponse.TrackingStep(
          "3", "Processing", "Your order is being prepared",
          baseTime.plusSeconds(7200), true));
    }

    if (order.getStatus().ordinal() >= OrderStatus.SHIPPED.ordinal()) {
      steps.add(new OrderTrackingResponse.TrackingStep(
          "4", "Shipped", "Your order has been shipped",
          baseTime.plusSeconds(86400), true));
    }

    if (order.getStatus().ordinal() >= OrderStatus.IN_TRANSIT.ordinal()) {
      steps.add(new OrderTrackingResponse.TrackingStep(
          "5", "In Transit", "Your order is on the way",
          baseTime.plusSeconds(2 * 86400), true));
    }

    if (order.getStatus().ordinal() >= OrderStatus.OUT_FOR_DELIVERY.ordinal()) {
      steps.add(new OrderTrackingResponse.TrackingStep(
          "6", "Out for Delivery", "Your order will arrive soon",
          baseTime.plusSeconds(4 * 86400), false));
    }

    if (order.getStatus() == OrderStatus.DELIVERED) {
      steps.add(new OrderTrackingResponse.TrackingStep(
          "7", "Delivered", "Your order has been delivered",
          baseTime.plusSeconds(5 * 86400), true));
    }

    return steps;
  }

  private String generateTrackingNumber() {
    return "ARKA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
  }
}

