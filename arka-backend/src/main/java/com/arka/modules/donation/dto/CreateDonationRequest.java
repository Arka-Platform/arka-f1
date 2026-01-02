package com.arka.modules.donation.dto;

import com.arka.modules.donation.entity.BookCondition;
import com.arka.modules.donation.entity.DonorType;
import java.util.List;
import java.util.UUID;

public record CreateDonationRequest(
    UUID ngoId,
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
    UUID userId
) {
  public record PickupAddress(
      String street,
      String city,
      String state,
      String pincode
  ) {}
}


