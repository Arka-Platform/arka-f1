package com.arka.modules.community.controller;

import com.arka.modules.community.dto.ChainActionResponse;
import com.arka.modules.community.dto.ChainStoryResponse;
import com.arka.modules.community.dto.CommunityCircleResponse;
import com.arka.modules.community.dto.CreateChainRequest;
import com.arka.modules.community.service.CommunityService;
import com.arka.modules.marketplace.dto.BookResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/community")
public class CommunityController {

  private final CommunityService communityService;

  public CommunityController(CommunityService communityService) {
    this.communityService = communityService;
  }

  @GetMapping("/circles")
  public ResponseEntity<List<CommunityCircleResponse>> listCircles() {
    return ResponseEntity.ok(communityService.getCircles());
  }

  @GetMapping("/circles/{circleId}")
  public ResponseEntity<CommunityCircleResponse> getCircle(@PathVariable String circleId) {
    return communityService.getCircleById(circleId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/circles/{circleId}/books")
  public ResponseEntity<List<BookResponse>> getCircleBooks(
      @PathVariable String circleId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return ResponseEntity.ok(communityService.getCircleBooks(circleId, page, size));
  }

  @GetMapping("/chains")
  public ResponseEntity<List<ChainStoryResponse>> listChains() {
    return ResponseEntity.ok(communityService.getChainStories());
  }

  @PostMapping("/chains")
  public ResponseEntity<ChainStoryResponse> createChain(@Valid @RequestBody CreateChainRequest request) {
    return ResponseEntity.ok(communityService.createChain(request));
  }

  @PostMapping("/chains/{chainId}/ping")
  public ResponseEntity<ChainActionResponse> pingChain(@PathVariable String chainId) {
    return ResponseEntity.ok(communityService.pingChain(chainId));
  }

  @PostMapping("/chains/{chainId}/keep-alive")
  public ResponseEntity<ChainActionResponse> keepAlive(@PathVariable String chainId) {
    return ResponseEntity.ok(communityService.keepChainAlive(chainId));
  }
}












