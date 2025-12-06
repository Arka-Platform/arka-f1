package com.arka.modules.order.dto;

import java.time.Instant;
import java.util.List;

public record OrderTrackingResponse(
    String orderId,
    String trackingNumber,
    String status,
    List<TrackingStep> steps,
    Instant estimatedDelivery
) {
  public record TrackingStep(
      String id,
      String title,
      String description,
      Instant date,
      Boolean completed
  ) {}
}



