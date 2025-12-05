package com.arka.modules.subscription.controller;

import com.arka.common.result.Result;
import com.arka.modules.subscription.dto.CreateSubscriptionRequest;
import com.arka.modules.subscription.dto.SubscriptionResponse;
import com.arka.modules.subscription.service.SubscriptionService;
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

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

  private final SubscriptionService subscriptionService;

  public SubscriptionController(SubscriptionService subscriptionService) {
    this.subscriptionService = subscriptionService;
  }

  @PostMapping
  public ResponseEntity<?> createSubscription(
      @RequestBody CreateSubscriptionRequest request) {
    Result<SubscriptionResponse> result = subscriptionService.createSubscription(request);
    return switch (result) {
      case Result.Success<SubscriptionResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<SubscriptionResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<?> getUserSubscription(
      @PathVariable UUID userId) {
    Result<SubscriptionResponse> result = subscriptionService.getUserSubscription(userId);
    return switch (result) {
      case Result.Success<SubscriptionResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<SubscriptionResponse> failure -> 
          ResponseEntity.notFound().build();
    };
  }

  @PutMapping("/user/{userId}/renew")
  public ResponseEntity<?> renewSubscription(
      @PathVariable UUID userId) {
    Result<SubscriptionResponse> result = subscriptionService.renewSubscription(userId);
    return switch (result) {
      case Result.Success<SubscriptionResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<SubscriptionResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }

  @DeleteMapping("/user/{userId}")
  public ResponseEntity<?> cancelSubscription(
      @PathVariable UUID userId) {
    Result<SubscriptionResponse> result = subscriptionService.cancelSubscription(userId);
    return switch (result) {
      case Result.Success<SubscriptionResponse> success -> 
          ResponseEntity.ok(success.value());
      case Result.Failure<SubscriptionResponse> failure -> 
          ResponseEntity.badRequest().body(java.util.Map.of("error", failure.message()));
    };
  }
}

