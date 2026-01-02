package com.arka.modules.donation.service;

import com.arka.common.result.Result;
import com.arka.modules.donation.dto.CreateNGORequest;
import com.arka.modules.donation.dto.NGOResponse;
import com.arka.modules.donation.dto.UpdateNGORequest;
import com.arka.modules.donation.entity.NGOEntity;
import com.arka.modules.donation.repository.DonationRepository;
import com.arka.modules.donation.repository.NGORepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Admin-only service for managing NGOs.
 * This service should only be accessible to Arka team members.
 */
@Service
public class AdminDonationService {
  private final NGORepository ngoRepository;
  private final DonationRepository donationRepository;

  public AdminDonationService(NGORepository ngoRepository, DonationRepository donationRepository) {
    this.ngoRepository = ngoRepository;
    this.donationRepository = donationRepository;
  }

  /**
   * Get all NGOs (admin only - includes unverified)
   */
  public List<NGOResponse> getAllNGOs() {
    List<NGOEntity> ngos = ngoRepository.findAll();
    return ngos.stream()
        .map(this::toNGOResponse)
        .collect(Collectors.toList());
  }

  /**
   * Create a new NGO (admin only)
   */
  @Transactional
  public Result<NGOResponse> createNGO(CreateNGORequest request) {
    if (request.name() == null || request.name().trim().isEmpty()) {
      return Result.failure("NGO name is required");
    }

    NGOEntity ngo = new NGOEntity(
        request.name().trim(),
        request.description() != null && !request.description().trim().isEmpty() ? request.description().trim() : null,
        request.location() != null && !request.location().trim().isEmpty() ? request.location().trim() : null
    );

    if (request.categories() != null && !request.categories().isEmpty()) {
      ngo.setCategories(request.categories());
    } else {
      ngo.setCategories(new ArrayList<>());
    }

    if (request.contactEmail() != null && !request.contactEmail().trim().isEmpty()) {
      ngo.setContactEmail(request.contactEmail().trim());
    } else {
      ngo.setContactEmail(null);
    }

    if (request.contactPhone() != null && !request.contactPhone().trim().isEmpty()) {
      ngo.setContactPhone(request.contactPhone().trim());
    } else {
      ngo.setContactPhone(null);
    }

    if (request.website() != null && !request.website().trim().isEmpty()) {
      ngo.setWebsite(request.website().trim());
    } else {
      ngo.setWebsite(null);
    }

    // Set verified status (default to true if not specified)
    ngo.setVerified(request.verified() != null ? request.verified() : true);
    ngo = ngoRepository.save(ngo);

    return Result.success(toNGOResponse(ngo));
  }

  /**
   * Update an existing NGO (admin only)
   */
  @Transactional
  public Result<NGOResponse> updateNGO(UUID ngoId, UpdateNGORequest request) {
    NGOEntity ngo = ngoRepository.findById(ngoId)
        .orElse(null);
    if (ngo == null) {
      return Result.failure("NGO not found");
    }

    if (request.name() != null && !request.name().trim().isEmpty()) {
      ngo.setName(request.name().trim());
    }

    if (request.description() != null) {
      ngo.setDescription(request.description().trim());
    }

    if (request.location() != null) {
      ngo.setLocation(request.location().trim());
    }

    if (request.categories() != null) {
      ngo.setCategories(request.categories());
    }

    if (request.contactEmail() != null) {
      ngo.setContactEmail(request.contactEmail().trim());
    }

    if (request.contactPhone() != null) {
      ngo.setContactPhone(request.contactPhone().trim());
    }

    if (request.website() != null) {
      ngo.setWebsite(request.website().trim());
    }

    if (request.verified() != null) {
      ngo.setVerified(request.verified());
    }

    ngo = ngoRepository.save(ngo);
    return Result.success(toNGOResponse(ngo));
  }

  /**
   * Delete an NGO (admin only)
   */
  @Transactional
  public Result<Void> deleteNGO(UUID ngoId) {
    NGOEntity ngo = ngoRepository.findById(ngoId)
        .orElse(null);
    if (ngo == null) {
      return Result.failure("NGO not found");
    }

    // Check if there are any donations associated with this NGO
    long donationCount = donationRepository.findByNgoIdOrderByCreatedAtDesc(ngoId).size();
    if (donationCount > 0) {
      return Result.failure("Cannot delete NGO with existing donations. Please contact support.");
    }

    ngoRepository.delete(ngo);
    return Result.success(null);
  }

  /**
   * Verify an NGO (admin only)
   */
  @Transactional
  public Result<NGOResponse> verifyNGO(UUID ngoId) {
    NGOEntity ngo = ngoRepository.findById(ngoId)
        .orElse(null);
    if (ngo == null) {
      return Result.failure("NGO not found");
    }

    ngo.setVerified(true);
    ngo = ngoRepository.save(ngo);
    return Result.success(toNGOResponse(ngo));
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
}

