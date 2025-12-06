package com.arka.modules.marketplace.controller;

import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.service.RecommendationService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {
  private final RecommendationService recommendationService;

  public RecommendationController(RecommendationService recommendationService) {
    this.recommendationService = recommendationService;
  }

  @GetMapping
  public ResponseEntity<List<BookResponse>> getRecommendations(
      @RequestParam(required = false) UUID userId,
      @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(recommendationService.getRecommendations(userId, limit));
  }

  @GetMapping("/popular")
  public ResponseEntity<List<BookResponse>> getPopularBooks(
      @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(recommendationService.getPopularBooks(limit));
  }

  @GetMapping("/similar")
  public ResponseEntity<List<BookResponse>> getSimilarBooks(
      @RequestParam UUID bookId,
      @RequestParam(defaultValue = "5") int limit) {
    return ResponseEntity.ok(recommendationService.getSimilarBooks(bookId, limit));
  }

  @GetMapping("/trending")
  public ResponseEntity<List<BookResponse>> getTrending(
      @RequestParam String category,
      @RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(recommendationService.getTrendingInCategory(category, limit));
  }
}
















