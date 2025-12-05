package com.arka.modules.storage.controller;

import com.arka.common.result.Result;
import com.arka.modules.storage.service.S3StorageService;
import java.util.Map;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/upload")
public class FileUploadController {

  private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
      "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
  );

  private final S3StorageService storageService;

  public FileUploadController(S3StorageService storageService) {
    this.storageService = storageService;
  }

  @PostMapping("/book-image")
  public ResponseEntity<?> uploadBookImage(@RequestParam("file") MultipartFile file) {
    ResponseEntity<?> validationResult = validateFile(file);
    if (validationResult != null) {
      return validationResult;
    }

    Result<String> result = storageService.uploadBookImage(file);
    return switch (result) {
      case Result.Success<String> success -> ResponseEntity.ok(Map.of("url", success.value()));
      case Result.Failure<String> failure -> ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  @PostMapping("/status-image")
  public ResponseEntity<?> uploadStatusImage(@RequestParam("file") MultipartFile file) {
    ResponseEntity<?> validationResult = validateFile(file);
    if (validationResult != null) {
      return validationResult;
    }

    Result<String> result = storageService.uploadStatusImage(file);
    return switch (result) {
      case Result.Success<String> success -> ResponseEntity.ok(Map.of("url", success.value()));
      case Result.Failure<String> failure -> ResponseEntity.badRequest().body(Map.of("error", failure.message()));
    };
  }

  private ResponseEntity<?> validateFile(MultipartFile file) {
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
    }

    if (file.getSize() > MAX_FILE_SIZE) {
      return ResponseEntity.badRequest()
          .body(Map.of("error", "File size exceeds maximum allowed size of 5MB"));
    }

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
      return ResponseEntity.badRequest()
          .body(Map.of("error", "Invalid file type. Allowed types: JPEG, PNG, WEBP, GIF"));
    }

    return null; // Validation passed
  }
}

