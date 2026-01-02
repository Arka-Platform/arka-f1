package com.arka.modules.storage.service;

import com.arka.common.result.Result;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Local file storage service for development/testing when S3 is not available
 * Stores files in the local filesystem under uploads/ directory
 */
@Service
public class LocalFileStorageService {

  private static final Logger log = LoggerFactory.getLogger(LocalFileStorageService.class);
  private final String uploadBaseDir;

  public LocalFileStorageService(@Value("${app.storage.local.upload-dir:uploads}") String uploadBaseDir) {
    this.uploadBaseDir = uploadBaseDir;
    initializeUploadDirectory();
  }

  private void initializeUploadDirectory() {
    try {
      Path uploadPath = Paths.get(uploadBaseDir);
      if (!Files.exists(uploadPath)) {
        Files.createDirectories(uploadPath);
        log.info("Created upload directory: {}", uploadPath.toAbsolutePath());
      }
    } catch (IOException e) {
      log.error("Failed to create upload directory: {}", uploadBaseDir, e);
    }
  }

  public Result<String> uploadFile(MultipartFile file, String folder) {
    try {
      String originalFilename = file.getOriginalFilename();
      if (originalFilename == null || originalFilename.isEmpty()) {
        return Result.failure("File name is required");
      }

      String extension = getFileExtension(originalFilename);
      String fileName = UUID.randomUUID() + extension;
      Path folderPath = Paths.get(uploadBaseDir, folder);
      
      // Create folder if it doesn't exist
      if (!Files.exists(folderPath)) {
        Files.createDirectories(folderPath);
      }

      Path filePath = folderPath.resolve(fileName);
      Files.copy(file.getInputStream(), filePath);

      // Return a relative URL that can be served by the application
      String fileUrl = "/uploads/" + folder + "/" + fileName;
      log.info("File uploaded locally: {}", filePath.toAbsolutePath());
      return Result.success(fileUrl);
    } catch (IOException e) {
      log.error("Failed to upload file locally", e);
      return Result.failure("Failed to upload file: " + e.getMessage());
    }
  }

  public Result<String> uploadBookImage(MultipartFile file) {
    return uploadFile(file, "books/images");
  }

  public Result<String> uploadStatusImage(MultipartFile file) {
    return uploadFile(file, "status/images");
  }

  private String getFileExtension(String filename) {
    int lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
  }
}




