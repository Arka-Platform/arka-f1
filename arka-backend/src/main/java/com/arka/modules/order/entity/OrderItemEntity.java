package com.arka.modules.order.entity;

import com.arka.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItemEntity extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "order_id", nullable = false)
  private OrderEntity order;

  @Column(name = "book_id", nullable = false)
  private UUID bookId;

  @Column(nullable = false)
  private Integer quantity = 1;

  @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
  private BigDecimal unitPrice;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal subtotal;

  protected OrderItemEntity() {
    // JPA
  }

  public OrderItemEntity(UUID bookId, Integer quantity, BigDecimal unitPrice) {
    this.bookId = bookId;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
  }

  // Getters and setters
  public OrderEntity getOrder() {
    return order;
  }

  public void setOrder(OrderEntity order) {
    this.order = order;
  }

  public UUID getBookId() {
    return bookId;
  }

  public void setBookId(UUID bookId) {
    this.bookId = bookId;
  }

  public Integer getQuantity() {
    return quantity;
  }

  public void setQuantity(Integer quantity) {
    this.quantity = quantity;
    this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
  }

  public BigDecimal getUnitPrice() {
    return unitPrice;
  }

  public void setUnitPrice(BigDecimal unitPrice) {
    this.unitPrice = unitPrice;
    this.subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
  }

  public BigDecimal getSubtotal() {
    return subtotal;
  }

  public void setSubtotal(BigDecimal subtotal) {
    this.subtotal = subtotal;
  }
}

