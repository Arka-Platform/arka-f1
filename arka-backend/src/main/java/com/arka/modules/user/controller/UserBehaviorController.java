package com.arka.modules.user.controller;

import com.arka.modules.user.service.UserBehaviorService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/behavior")
public class UserBehaviorController {
  private final UserBehaviorService behaviorService;

  public UserBehaviorController(UserBehaviorService behaviorService) {
    this.behaviorService = behaviorService;
  }

  @PostMapping("/view")
  public ResponseEntity<Void> trackView(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam UUID bookId,
      @RequestParam(required = false, defaultValue = "0") Integer durationSeconds) {
    UUID userId = UUID.fromString(authenticatedUserId);
    behaviorService.trackBookView(userId, bookId, durationSeconds);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/search")
  public ResponseEntity<Void> trackSearch(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String subcategory) {
    UUID userId = UUID.fromString(authenticatedUserId);
    behaviorService.trackSearch(userId, query, category, subcategory);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/cart/add")
  public ResponseEntity<Void> trackCartAdd(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam UUID bookId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    behaviorService.trackCartAdd(userId, bookId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/cart/remove")
  public ResponseEntity<Void> trackCartRemove(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam UUID bookId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    behaviorService.trackCartRemove(userId, bookId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/purchase")
  public ResponseEntity<Void> trackPurchase(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam UUID bookId) {
    UUID userId = UUID.fromString(authenticatedUserId);
    behaviorService.trackPurchase(userId, bookId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/category/view")
  public ResponseEntity<Void> trackCategoryView(
      @AuthenticationPrincipal String authenticatedUserId,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String subcategory) {
    UUID userId = UUID.fromString(authenticatedUserId);
    behaviorService.trackCategoryView(userId, category, subcategory);
    return ResponseEntity.ok().build();
  }
}





















