package com.arka.modules.recycling.controller;

import com.arka.modules.recycling.dto.WastePaperResponse;
import com.arka.modules.recycling.service.RecyclingService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recycling")
public class RecyclingController {
  private final RecyclingService service;

  public RecyclingController(RecyclingService service) {
    this.service = service;
  }

  @GetMapping
  public ResponseEntity<List<WastePaperResponse>> list(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String category) {
    if (search != null && !search.trim().isEmpty()) {
      return ResponseEntity.ok(service.search(search.trim()));
    }
    if (category != null && !category.trim().isEmpty()) {
      return ResponseEntity.ok(service.listByCategory(category.trim()));
    }
    return ResponseEntity.ok(service.listAll());
  }
}











