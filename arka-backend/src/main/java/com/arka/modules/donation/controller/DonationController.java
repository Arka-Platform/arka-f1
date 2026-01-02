package com.arka.modules.donation.controller;

import com.arka.common.result.Result;
import com.arka.modules.donation.dto.CreateDonationRequest;
import com.arka.modules.donation.dto.DonationResponse;
import com.arka.modules.donation.dto.NGOResponse;
import com.arka.modules.donation.service.DonationService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/donations")
public class DonationController {
  private final DonationService donationService;

  public DonationController(DonationService donationService) {
    this.donationService = donationService;
  }

  @GetMapping("/ngos")
  public ResponseEntity<List<NGOResponse>> getNGOs() {
    return ResponseEntity.ok(donationService.getNGOs());
  }

  @PostMapping
  public ResponseEntity<?> createDonation(@RequestBody CreateDonationRequest request) {
    Result<DonationResponse> result = donationService.createDonation(request);
    return switch (result) {
      case Result.Success<DonationResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<DonationResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @GetMapping("/my")
  public ResponseEntity<List<DonationResponse>> getMyDonations(
      @RequestParam UUID userId) {
    return ResponseEntity.ok(donationService.getUserDonations(userId));
  }

  @GetMapping("/{donationId}")
  public ResponseEntity<?> getDonation(@PathVariable UUID donationId) {
    Result<DonationResponse> result = donationService.getDonation(donationId);
    return switch (result) {
      case Result.Success<DonationResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<DonationResponse> failure -> 
          ResponseEntity.notFound().build();
    };
  }

  @DeleteMapping("/{donationId}")
  public ResponseEntity<?> cancelDonation(@PathVariable UUID donationId) {
    Result<DonationResponse> result = donationService.cancelDonation(donationId);
    return switch (result) {
      case Result.Success<DonationResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<DonationResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }
}

