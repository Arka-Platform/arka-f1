package com.arka.modules.storage.controller;

import com.arka.common.result.Result;
import com.arka.modules.storage.service.LocalFileStorageService;
import com.arka.modules.storage.service.S3StorageService;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
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

  private final S3StorageService s3StorageService;
  private final LocalFileStorageService localFileStorageService;

  public FileUploadController(
      @Autowired(required = false) S3StorageService s3StorageService,
      LocalFileStorageService localFileStorageService) {
    this.s3StorageService = s3StorageService;
    this.localFileStorageService = localFileStorageService;
  }

  @PostMapping("/book-image")
  public ResponseEntity<?> uploadBookImage(@RequestParam("file") MultipartFile file) {
    ResponseEntity<?> validationResult = validateFile(file);
    if (validationResult != null) {
      return validationResult;
    }

    // Try S3 first, fallback to local storage
    Result<String> result = null;
    if (s3StorageService != null && s3StorageService.isS3Available()) {
      result = s3StorageService.uploadBookImage(file);
      // If S3 fails, fallback to local storage
      if (result instanceof Result.Failure) {
        result = localFileStorageService.uploadBookImage(file);
      }
    } else {
      // S3 not available, use local storage
      result = localFileStorageService.uploadBookImage(file);
    }

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

    // Try S3 first, fallback to local storage
    Result<String> result = null;
    if (s3StorageService != null && s3StorageService.isS3Available()) {
      result = s3StorageService.uploadStatusImage(file);
      // If S3 fails, fallback to local storage
      if (result instanceof Result.Failure) {
        result = localFileStorageService.uploadStatusImage(file);
      }
    } else {
      // S3 not available, use local storage
      result = localFileStorageService.uploadStatusImage(file);
    }

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
    String originalFilename = file.getOriginalFilename();
    
    // Check content type first
    boolean hasValidContentType = contentType != null && 
        ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase());
    
    // If content type is invalid or missing, check file extension as fallback
    boolean hasValidExtension = false;
    if (originalFilename != null) {
      String lowerFilename = originalFilename.toLowerCase();
      hasValidExtension = lowerFilename.endsWith(".jpg") || 
                         lowerFilename.endsWith(".jpeg") || 
                         lowerFilename.endsWith(".png") || 
                         lowerFilename.endsWith(".gif") || 
                         lowerFilename.endsWith(".webp");
    }
    
    if (!hasValidContentType && !hasValidExtension) {
      return ResponseEntity.badRequest()
          .body(Map.of("error", 
              String.format("Invalid file type. Content type: %s, Filename: %s. Allowed types: JPEG, PNG, WEBP, GIF", 
                  contentType != null ? contentType : "unknown", 
                  originalFilename != null ? originalFilename : "unknown")));
    }

    return null; // Validation passed
  }
}

