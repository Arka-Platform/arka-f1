package com.arka.modules.donation.dto;

import com.arka.modules.donation.entity.BookCondition;
import com.arka.modules.donation.entity.DonationStatus;
import com.arka.modules.donation.entity.DonorType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DonationResponse(
    UUID id,
    UUID ngoId,
    String ngoName,
    String donorName,
    String donorEmail,
    String donorPhone,
    DonorType donorType,
    String institutionName,
    Integer bookCount,
    List<String> bookCategories,
    BookCondition condition,
    PickupAddress pickupAddress,
    String additionalNotes,
    DonationStatus status,
    UUID userId,
    Instant createdAt,
    Instant updatedAt
) {
  public record PickupAddress(
      String street,
      String city,
      String state,
      String pincode
  ) {}
}


