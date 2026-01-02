package com.arka.modules.user.service;

import com.arka.modules.user.entity.OtpEntity;
import com.arka.modules.user.repository.OtpRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.SnsException;

@Service
public class OtpService {
  private static final Logger log = LoggerFactory.getLogger(OtpService.class);
  private static final SecureRandom random = new SecureRandom();

  private final OtpRepository otpRepository;
  private final JavaMailSender mailSender;
  private final int otpLength;
  private final int expirationMinutes;
  private final boolean emailEnabled;
  private final boolean phoneEnabled;
  private final String smsProvider;
  private final SnsClient snsClient;

  public OtpService(
      OtpRepository otpRepository,
      @Autowired(required = false) JavaMailSender mailSender,
      @Value("${app.otp.email.length:6}") int otpLength,
      @Value("${app.otp.email.expiration-minutes:10}") int expirationMinutes,
      @Value("${app.otp.email.enabled:true}") boolean emailEnabled,
      @Value("${app.otp.phone.enabled:true}") boolean phoneEnabled,
      @Value("${app.otp.phone.provider:aws-sns}") String smsProvider,
      @Value("${app.sms.aws.region:us-east-1}") String awsRegion) {
    this.otpRepository = otpRepository;
    this.mailSender = mailSender;
    this.otpLength = otpLength;
    this.expirationMinutes = expirationMinutes;
    this.emailEnabled = emailEnabled;
    this.phoneEnabled = phoneEnabled;
    this.smsProvider = smsProvider;
    
    // Initialize SNS client if AWS SNS is enabled
    SnsClient tempSnsClient = null;
    if ("aws-sns".equals(smsProvider)) {
      try {
        tempSnsClient = SnsClient.builder()
            .region(Region.of(awsRegion))
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
      } catch (Exception e) {
        log.warn("Failed to initialize SNS client: {}", e.getMessage());
      }
    }
    this.snsClient = tempSnsClient;
  }

  /**
   * Generate and send OTP via email
   */
  @Transactional
  public void sendEmailOtp(String email) {
    if (!emailEnabled) {
      throw new IllegalStateException("Email OTP is disabled");
    }

    if (mailSender == null) {
      throw new IllegalStateException("Email service is not configured. Please configure SMTP settings.");
    }

    String otpCode = generateOtp();
    LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

    // Invalidate previous unused OTPs
    otpRepository.findLatestUnusedOtp(email, "email")
        .ifPresent(otp -> otp.setUsed(true));

    // Create new OTP
    OtpEntity otp = new OtpEntity(email, otpCode, "email", expiresAt);
    otpRepository.save(otp);

    // Send email
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setTo(email);
      message.setSubject("Arka - Email Verification Code");
      message.setText("Your verification code is: " + otpCode + "\n\nThis code will expire in " + expirationMinutes + " minutes.");
      mailSender.send(message);
      log.info("OTP sent to email: {}", email);
    } catch (Exception e) {
      log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
      throw new RuntimeException("Failed to send OTP email", e);
    }
  }

  /**
   * Generate and send OTP via SMS
   */
  @Transactional
  public void sendPhoneOtp(String phoneNumber) {
    if (!phoneEnabled) {
      throw new IllegalStateException("Phone OTP is disabled");
    }

    String otpCode = generateOtp();
    LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

    // Invalidate previous unused OTPs
    otpRepository.findLatestUnusedOtp(phoneNumber, "phone")
        .ifPresent(otp -> otp.setUsed(true));

    // Create new OTP
    OtpEntity otp = new OtpEntity(phoneNumber, otpCode, "phone", expiresAt);
    otpRepository.save(otp);

    // Send SMS
    try {
      if ("aws-sns".equals(smsProvider) && snsClient != null) {
        sendSmsViaAwsSns(phoneNumber, otpCode);
      } else {
        log.warn("SMS provider not configured or not available");
        throw new IllegalStateException("SMS service not available");
      }
      log.info("OTP sent to phone: {}", phoneNumber);
    } catch (Exception e) {
      log.error("Failed to send OTP SMS to {}: {}", phoneNumber, e.getMessage());
      throw new RuntimeException("Failed to send OTP SMS", e);
    }
  }

  /**
   * Verify OTP code
   */
  @Transactional
  public boolean verifyOtp(String emailOrPhone, String otpCode, String otpType) {
    Optional<OtpEntity> otpOpt = otpRepository
        .findByEmailOrPhoneAndOtpCodeAndOtpTypeAndUsedFalse(emailOrPhone, otpCode, otpType);

    if (otpOpt.isEmpty()) {
      return false;
    }

    OtpEntity otp = otpOpt.get();
    if (otp.isExpired()) {
      return false;
    }

    // Mark as used
    otp.setUsed(true);
    otpRepository.save(otp);
    return true;
  }

  private String generateOtp() {
    StringBuilder otp = new StringBuilder();
    for (int i = 0; i < otpLength; i++) {
      otp.append(random.nextInt(10));
    }
    return otp.toString();
  }

  private void sendSmsViaAwsSns(String phoneNumber, String otpCode) {
    try {
      String message = "Your Arka verification code is: " + otpCode + ". Valid for " + expirationMinutes + " minutes.";
      PublishRequest request = PublishRequest.builder()
          .phoneNumber(phoneNumber)
          .message(message)
          .build();
      snsClient.publish(request);
    } catch (SnsException e) {
      log.error("AWS SNS error: {}", e.getMessage());
      throw new RuntimeException("Failed to send SMS via AWS SNS", e);
    }
  }
}

