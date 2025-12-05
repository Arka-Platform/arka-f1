package com.arka.modules.order.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class OrderEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
  private BigDecimal totalAmount;

  @Column(name = "pickup_fee", nullable = false, precision = 10, scale = 2)
  private BigDecimal pickupFee = BigDecimal.ONE;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus status = OrderStatus.PENDING;

  @Column(name = "shipping_address", columnDefinition = "TEXT")
  private String shippingAddress;

  @Column(name = "pickup_time", length = 50)
  private String pickupTime;

  @Column(name = "payment_method", length = 50)
  private String paymentMethod;

  @Column(name = "contact_phone", length = 50)
  private String contactPhone;

  @Column(name = "special_instructions", columnDefinition = "TEXT")
  private String specialInstructions;

  @Column(name = "tracking_number", length = 100, unique = true)
  private String trackingNumber;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItemEntity> items = new ArrayList<>();

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }

  protected OrderEntity() {
    // JPA
  }

  public OrderEntity(UUID userId, BigDecimal totalAmount, BigDecimal pickupFee) {
    this.userId = userId;
    this.totalAmount = totalAmount;
    this.pickupFee = pickupFee;
  }

  // Getters and setters
  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public BigDecimal getTotalAmount() {
    return totalAmount;
  }

  public void setTotalAmount(BigDecimal totalAmount) {
    this.totalAmount = totalAmount;
  }

  public BigDecimal getPickupFee() {
    return pickupFee;
  }

  public void setPickupFee(BigDecimal pickupFee) {
    this.pickupFee = pickupFee;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public String getShippingAddress() {
    return shippingAddress;
  }

  public void setShippingAddress(String shippingAddress) {
    this.shippingAddress = shippingAddress;
  }

  public String getPickupTime() {
    return pickupTime;
  }

  public void setPickupTime(String pickupTime) {
    this.pickupTime = pickupTime;
  }

  public String getPaymentMethod() {
    return paymentMethod;
  }

  public void setPaymentMethod(String paymentMethod) {
    this.paymentMethod = paymentMethod;
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String contactPhone) {
    this.contactPhone = contactPhone;
  }

  public String getSpecialInstructions() {
    return specialInstructions;
  }

  public void setSpecialInstructions(String specialInstructions) {
    this.specialInstructions = specialInstructions;
  }

  public String getTrackingNumber() {
    return trackingNumber;
  }

  public void setTrackingNumber(String trackingNumber) {
    this.trackingNumber = trackingNumber;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public List<OrderItemEntity> getItems() {
    return items;
  }

  public void setItems(List<OrderItemEntity> items) {
    this.items = items;
  }

  public void addItem(OrderItemEntity item) {
    items.add(item);
    item.setOrder(this);
  }
}

