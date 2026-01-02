package com.arka.modules.trustscore.controller;

import com.arka.modules.trustscore.dto.TrustScoreResponse;
import com.arka.modules.trustscore.service.TrustScoreService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trustscore")
public class TrustScoreController {
  private final TrustScoreService trustScoreService;

  public TrustScoreController(TrustScoreService trustScoreService) {
    this.trustScoreService = trustScoreService;
  }

  @GetMapping
  public ResponseEntity<?> getTrustScore(@RequestParam UUID userId) {
    try {
      TrustScoreResponse response = trustScoreService.getTrustScore(userId);
      return ResponseEntity.ok(response);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to get trust score: " + e.getMessage()));
    }
  }
}

