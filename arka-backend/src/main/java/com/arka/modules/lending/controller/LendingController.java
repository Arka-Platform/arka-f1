package com.arka.modules.lending.controller;

import com.arka.common.result.Result;
import com.arka.modules.lending.dto.CreateLendingRequest;
import com.arka.modules.lending.dto.LendingResponse;
import com.arka.modules.lending.service.LendingService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lending")
public class LendingController {

  private final LendingService lendingService;

  public LendingController(LendingService lendingService) {
    this.lendingService = lendingService;
  }

  @PostMapping("/request")
  public ResponseEntity<?> requestLending(@RequestBody CreateLendingRequest request) {
    Result<LendingResponse> result = lendingService.requestLending(request);
    return switch (result) {
      case Result.Success<LendingResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<LendingResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @PutMapping("/{lendingId}/approve")
  public ResponseEntity<?> approveLending(
      @PathVariable UUID lendingId,
      @RequestParam UUID ownerId) {
    Result<LendingResponse> result = lendingService.approveLending(lendingId, ownerId);
    return switch (result) {
      case Result.Success<LendingResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<LendingResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @PutMapping("/{lendingId}/reject")
  public ResponseEntity<?> rejectLending(
      @PathVariable UUID lendingId,
      @RequestParam UUID ownerId,
      @RequestParam(required = false) String reason) {
    Result<LendingResponse> result = lendingService.rejectLending(lendingId, ownerId, reason);
    return switch (result) {
      case Result.Success<LendingResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<LendingResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @PutMapping("/{lendingId}/start")
  public ResponseEntity<?> startLending(
      @PathVariable UUID lendingId,
      @RequestParam UUID ownerId,
      @RequestParam(required = false) String conditionBefore) {
    Result<LendingResponse> result = lendingService.startLending(lendingId, ownerId, conditionBefore);
    return switch (result) {
      case Result.Success<LendingResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<LendingResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @PutMapping("/{lendingId}/return")
  public ResponseEntity<?> returnBook(
      @PathVariable UUID lendingId,
      @RequestParam UUID borrowerId,
      @RequestParam(required = false) String conditionAfter) {
    Result<LendingResponse> result = lendingService.returnBook(lendingId, borrowerId, conditionAfter);
    return switch (result) {
      case Result.Success<LendingResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<LendingResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<List<LendingResponse>> getUserLendings(@PathVariable UUID userId) {
    return ResponseEntity.ok(lendingService.getUserLendings(userId));
  }

  @GetMapping("/user/{userId}/active")
  public ResponseEntity<List<LendingResponse>> getActiveLendings(@PathVariable UUID userId) {
    return ResponseEntity.ok(lendingService.getActiveLendings(userId));
  }
}

