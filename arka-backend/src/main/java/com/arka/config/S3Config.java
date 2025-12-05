package com.arka.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Config {

  private static final Logger log = LoggerFactory.getLogger(S3Config.class);

  @Value("${app.aws.s3.region:us-east-1}")
  private String region;

  @Value("${app.aws.s3.bucket-name:}")
  private String bucketName;

  @Bean
  public S3Client s3Client() {
    // Only create S3 client if bucket name is configured
    if (bucketName == null || bucketName.isEmpty()) {
      log.warn("S3 bucket name not configured, S3 uploads will be disabled");
      return null;
    }

    try {
      log.info("Initializing S3 client for region: {}", region);
      return S3Client.builder()
          .region(Region.of(region))
          .credentialsProvider(DefaultCredentialsProvider.create())
          .build();
    } catch (Exception e) {
      // If S3 client creation fails, log warning and return null
      // Application will still start, but S3 uploads will be disabled
      log.warn("Failed to create S3 client, S3 uploads will be disabled: {}", e.getMessage());
      return null;
    }
  }
}

