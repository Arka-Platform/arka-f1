package com.arka.modules.donation.service;

import com.arka.common.result.Result;
import com.arka.modules.donation.dto.CreateDonationRequest;
import com.arka.modules.donation.dto.DonationResponse;
import com.arka.modules.donation.dto.NGOResponse;
import com.arka.modules.donation.entity.DonationEntity;
import com.arka.modules.donation.entity.DonationStatus;
import com.arka.modules.donation.entity.NGOEntity;
import com.arka.modules.donation.repository.DonationRepository;
import com.arka.modules.donation.repository.NGORepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DonationService {
  private final NGORepository ngoRepository;
  private final DonationRepository donationRepository;

  public DonationService(NGORepository ngoRepository, DonationRepository donationRepository) {
    this.ngoRepository = ngoRepository;
    this.donationRepository = donationRepository;
  }

  /**
   * Get all verified NGOs
   */
  public List<NGOResponse> getNGOs() {
    List<NGOEntity> ngos = ngoRepository.findByVerifiedTrue();
    return ngos.stream()
        .map(this::toNGOResponse)
        .collect(Collectors.toList());
  }

  /**
   * Create a donation request
   */
  @Transactional
  public Result<DonationResponse> createDonation(CreateDonationRequest request) {
    // Validate NGO exists
    NGOEntity ngo = ngoRepository.findById(request.ngoId())
        .orElse(null);
    if (ngo == null) {
      return Result.failure("NGO not found");
    }

    // Create donation entity
    DonationEntity donation = new DonationEntity(
        request.ngoId(),
        request.donorName(),
        request.donorEmail(),
        request.donorPhone(),
        request.donorType(),
        request.bookCount(),
        request.condition(),
        request.pickupAddress().street(),
        request.pickupAddress().city(),
        request.pickupAddress().state(),
        request.pickupAddress().pincode()
    );

    if (request.institutionName() != null && !request.institutionName().trim().isEmpty()) {
      donation.setInstitutionName(request.institutionName().trim());
    }

    if (request.bookCategories() != null && !request.bookCategories().isEmpty()) {
      donation.setBookCategories(request.bookCategories());
    }

    if (request.additionalNotes() != null && !request.additionalNotes().trim().isEmpty()) {
      donation.setAdditionalNotes(request.additionalNotes().trim());
    }

    if (request.userId() != null) {
      donation.setUserId(request.userId());
    }

    donation.setStatus(DonationStatus.PENDING);
    donation = donationRepository.save(donation);

    return Result.success(toDonationResponse(donation, ngo.getName()));
  }

  /**
   * Get user's donations
   */
  public List<DonationResponse> getUserDonations(UUID userId) {
    List<DonationEntity> donations = donationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    return donations.stream()
        .map(d -> {
          NGOEntity ngo = ngoRepository.findById(d.getNgoId()).orElse(null);
          return toDonationResponse(d, ngo != null ? ngo.getName() : "Unknown NGO");
        })
        .collect(Collectors.toList());
  }

  /**
   * Get donation by ID
   */
  public Result<DonationResponse> getDonation(UUID donationId) {
    DonationEntity donation = donationRepository.findById(donationId)
        .orElse(null);
    if (donation == null) {
      return Result.failure("Donation not found");
    }

    NGOEntity ngo = ngoRepository.findById(donation.getNgoId()).orElse(null);
    return Result.success(toDonationResponse(donation, ngo != null ? ngo.getName() : "Unknown NGO"));
  }

  /**
   * Cancel a donation
   */
  @Transactional
  public Result<DonationResponse> cancelDonation(UUID donationId) {
    DonationEntity donation = donationRepository.findById(donationId)
        .orElse(null);
    if (donation == null) {
      return Result.failure("Donation not found");
    }

    if (donation.getStatus() == DonationStatus.COMPLETED) {
      return Result.failure("Cannot cancel a completed donation");
    }

    donation.setStatus(DonationStatus.CANCELLED);
    donation = donationRepository.save(donation);

    NGOEntity ngo = ngoRepository.findById(donation.getNgoId()).orElse(null);
    return Result.success(toDonationResponse(donation, ngo != null ? ngo.getName() : "Unknown NGO"));
  }

  private NGOResponse toNGOResponse(NGOEntity ngo) {
    // Count completed donations for this NGO
    Long booksReceived = donationRepository.countCompletedByNgoId(ngo.getId());
    
    return new NGOResponse(
        ngo.getId(),
        ngo.getName(),
        ngo.getDescription(),
        ngo.getLocation(),
        ngo.getVerified(),
        booksReceived != null ? booksReceived.intValue() : 0,
        ngo.getCategories(),
        ngo.getContactEmail(),
        ngo.getContactPhone(),
        ngo.getWebsite()
    );
  }

  private DonationResponse toDonationResponse(DonationEntity donation, String ngoName) {
    return new DonationResponse(
        donation.getId(),
        donation.getNgoId(),
        ngoName,
        donation.getDonorName(),
        donation.getDonorEmail(),
        donation.getDonorPhone(),
        donation.getDonorType(),
        donation.getInstitutionName(),
        donation.getBookCount(),
        donation.getBookCategories(),
        donation.getCondition(),
        new DonationResponse.PickupAddress(
            donation.getPickupStreet(),
            donation.getPickupCity(),
            donation.getPickupState(),
            donation.getPickupPincode()
        ),
        donation.getAdditionalNotes(),
        donation.getStatus(),
        donation.getUserId(),
        donation.getCreatedAt(),
        Instant.now() // In a real app, this would be updatedAt from entity
    );
  }
}

