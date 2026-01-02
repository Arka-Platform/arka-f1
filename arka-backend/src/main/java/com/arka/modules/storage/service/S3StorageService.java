package com.arka.modules.storage.service;

import com.arka.common.result.Result;
import java.io.InputStream;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
public class S3StorageService {

  private final S3Client s3Client;
  private final String bucketName;

  public S3StorageService(@Autowired(required = false) S3Client s3Client, @Value("${app.aws.s3.bucket-name:}") String bucketName) {
    this.s3Client = s3Client;
    this.bucketName = bucketName;
  }
  
  public boolean isS3Available() {
    return s3Client != null && bucketName != null && !bucketName.isEmpty();
  }

  public Result<String> uploadFile(MultipartFile file, String folder) {
    if (!isS3Available()) {
      return Result.failure("S3 storage is not available. Please configure AWS_S3_BUCKET_NAME environment variable.");
    }

    try {
      String originalFilename = file.getOriginalFilename();
      if (originalFilename == null || originalFilename.isEmpty()) {
        return Result.failure("File name is required");
      }

      String extension = getFileExtension(originalFilename);
      String fileName = folder + "/" + UUID.randomUUID() + extension;
      String contentType = file.getContentType();

      PutObjectRequest putObjectRequest = PutObjectRequest.builder()
          .bucket(bucketName)
          .key(fileName)
          .contentType(contentType != null ? contentType : "application/octet-stream")
          .build();

      try (InputStream inputStream = file.getInputStream()) {
        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, file.getSize()));
      }

      String fileUrl = "https://" + bucketName + ".s3.amazonaws.com/" + fileName;
      return Result.success(fileUrl);
    } catch (S3Exception e) {
      return Result.failure("Failed to upload file to S3: " + e.getMessage());
    } catch (Exception e) {
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

