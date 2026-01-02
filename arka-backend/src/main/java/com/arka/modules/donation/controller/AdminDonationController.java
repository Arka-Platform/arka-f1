package com.arka.modules.donation.controller;

import com.arka.common.result.Result;
import com.arka.modules.donation.dto.CreateNGORequest;
import com.arka.modules.donation.dto.NGOResponse;
import com.arka.modules.donation.dto.UpdateNGORequest;
import com.arka.modules.donation.service.AdminDonationService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only controller for managing NGOs.
 * Only accessible to Arka team members with admin credentials.
 */
@RestController
@RequestMapping("/api/admin/donations")
public class AdminDonationController {
  private final AdminDonationService adminDonationService;

  public AdminDonationController(AdminDonationService adminDonationService) {
    this.adminDonationService = adminDonationService;
  }

  @GetMapping("/ngos")
  public ResponseEntity<List<NGOResponse>> getAllNGOs() {
    return ResponseEntity.ok(adminDonationService.getAllNGOs());
  }

  @PostMapping("/ngos")
  public ResponseEntity<?> createNGO(@RequestBody CreateNGORequest request) {
    Result<NGOResponse> result = adminDonationService.createNGO(request);
    return switch (result) {
      case Result.Success<NGOResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<NGOResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @PutMapping("/ngos/{ngoId}")
  public ResponseEntity<?> updateNGO(
      @PathVariable UUID ngoId,
      @RequestBody UpdateNGORequest request) {
    Result<NGOResponse> result = adminDonationService.updateNGO(ngoId, request);
    return switch (result) {
      case Result.Success<NGOResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<NGOResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @DeleteMapping("/ngos/{ngoId}")
  public ResponseEntity<?> deleteNGO(@PathVariable UUID ngoId) {
    Result<Void> result = adminDonationService.deleteNGO(ngoId);
    return switch (result) {
      case Result.Success<Void> success -> 
          ResponseEntity.ok().build();
      case Result.Failure<Void> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @PutMapping("/ngos/{ngoId}/verify")
  public ResponseEntity<?> verifyNGO(@PathVariable UUID ngoId) {
    Result<NGOResponse> result = adminDonationService.verifyNGO(ngoId);
    return switch (result) {
      case Result.Success<NGOResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<NGOResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }
}

