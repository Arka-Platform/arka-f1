package com.arka.modules.recycling.controller;

import com.arka.modules.recycling.service.RecyclingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recycling")
public class RecyclingController {
  private final RecyclingService service;

  public RecyclingController(RecyclingService service) {
    this.service = service;
  }

  @GetMapping("/status")
  public ResponseEntity<String> status() {
    return ResponseEntity.ok(service.status());
  }
}

