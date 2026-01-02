package com.arka.modules.wishlist.controller;

import com.arka.modules.wishlist.dto.AddToWishlistRequest;
import com.arka.modules.wishlist.dto.WishlistItemResponse;
import com.arka.modules.wishlist.service.WishlistService;
import java.util.List;
import java.util.Map;
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
@RequestMapping("/api/v1/wishlist")
public class WishlistController {
  private final WishlistService wishlistService;

  public WishlistController(WishlistService wishlistService) {
    this.wishlistService = wishlistService;
  }

  @PostMapping("/items")
  public ResponseEntity<?> addToWishlist(
      @RequestParam UUID userId,
      @RequestParam UUID bookId,
      @RequestBody(required = false) AddToWishlistRequest request) {
    try {
      WishlistItemResponse response = wishlistService.addToWishlist(userId, bookId, request);
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @DeleteMapping("/items")
  public ResponseEntity<?> removeFromWishlist(
      @RequestParam UUID userId,
      @RequestParam UUID bookId) {
    try {
      wishlistService.removeFromWishlist(userId, bookId);
      return ResponseEntity.ok(Map.of("message", "Book removed from wishlist"));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/items")
  public ResponseEntity<List<WishlistItemResponse>> getWishlist(@RequestParam UUID userId) {
    List<WishlistItemResponse> wishlist = wishlistService.getWishlist(userId);
    return ResponseEntity.ok(wishlist);
  }

  @GetMapping("/items/check")
  public ResponseEntity<Map<String, Boolean>> checkInWishlist(
      @RequestParam UUID userId,
      @RequestParam UUID bookId) {
    boolean isInWishlist = wishlistService.isInWishlist(userId, bookId);
    return ResponseEntity.ok(Map.of("isInWishlist", isInWishlist));
  }

  @GetMapping("/count")
  public ResponseEntity<Map<String, Long>> getWishlistCount(@RequestParam UUID userId) {
    long count = wishlistService.getWishlistCount(userId);
    return ResponseEntity.ok(Map.of("count", count));
  }
}


