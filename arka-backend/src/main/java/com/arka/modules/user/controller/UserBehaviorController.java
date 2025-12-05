package com.arka.modules.user.controller;

import com.arka.modules.user.service.UserBehaviorService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
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
      @RequestParam UUID userId,
      @RequestParam UUID bookId,
      @RequestParam(required = false, defaultValue = "0") Integer durationSeconds) {
    behaviorService.trackBookView(userId, bookId, durationSeconds);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/search")
  public ResponseEntity<Void> trackSearch(
      @RequestParam UUID userId,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String subcategory) {
    behaviorService.trackSearch(userId, query, category, subcategory);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/cart/add")
  public ResponseEntity<Void> trackCartAdd(
      @RequestParam UUID userId,
      @RequestParam UUID bookId) {
    behaviorService.trackCartAdd(userId, bookId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/cart/remove")
  public ResponseEntity<Void> trackCartRemove(
      @RequestParam UUID userId,
      @RequestParam UUID bookId) {
    behaviorService.trackCartRemove(userId, bookId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/purchase")
  public ResponseEntity<Void> trackPurchase(
      @RequestParam UUID userId,
      @RequestParam UUID bookId) {
    behaviorService.trackPurchase(userId, bookId);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/category/view")
  public ResponseEntity<Void> trackCategoryView(
      @RequestParam UUID userId,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String subcategory) {
    behaviorService.trackCategoryView(userId, category, subcategory);
    return ResponseEntity.ok().build();
  }
}














