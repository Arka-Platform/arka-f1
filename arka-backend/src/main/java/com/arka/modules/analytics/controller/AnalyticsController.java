package com.arka.modules.analytics.controller;

import com.arka.modules.analytics.dto.BookAnalyticsResponse;
import com.arka.modules.analytics.dto.PlatformInsightsResponse;
import com.arka.modules.analytics.dto.UserAnalyticsResponse;
import com.arka.modules.analytics.service.AnalyticsService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

  private final AnalyticsService analyticsService;

  public AnalyticsController(AnalyticsService analyticsService) {
    this.analyticsService = analyticsService;
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<UserAnalyticsResponse> getUserAnalytics(@PathVariable UUID userId) {
    UserAnalyticsResponse analytics = analyticsService.getUserAnalytics(userId);
    return ResponseEntity.ok(analytics);
  }

  @GetMapping("/book/{bookId}")
  public ResponseEntity<BookAnalyticsResponse> getBookAnalytics(@PathVariable UUID bookId) {
    BookAnalyticsResponse analytics = analyticsService.getBookAnalytics(bookId);
    if (analytics == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(analytics);
  }

  @GetMapping("/platform")
  public ResponseEntity<PlatformInsightsResponse> getPlatformInsights() {
    PlatformInsightsResponse insights = analyticsService.getPlatformInsights();
    return ResponseEntity.ok(insights);
  }
}



