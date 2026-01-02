package com.arka.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
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
  @ConditionalOnExpression("!'${app.aws.s3.bucket-name:}'.isEmpty()")
  public S3Client s3Client() {
    try {
      log.info("Initializing S3 client for region: {} with bucket: {}", region, bucketName);
      return S3Client.builder()
          .region(Region.of(region))
          .credentialsProvider(DefaultCredentialsProvider.create())
          .build();
    } catch (Exception e) {
      log.warn("Failed to create S3 client, S3 uploads will be disabled: {}", e.getMessage());
      throw new RuntimeException("Failed to initialize S3 client", e);
    }
  }
}

