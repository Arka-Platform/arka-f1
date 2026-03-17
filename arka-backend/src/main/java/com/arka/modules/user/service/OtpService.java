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

  public OtpService(
      OtpRepository otpRepository,
      @Autowired(required = false) JavaMailSender mailSender,
      @Value("${app.otp.email.length:6}") int otpLength,
      @Value("${app.otp.email.expiration-minutes:10}") int expirationMinutes,
      @Value("${app.otp.email.enabled:true}") boolean emailEnabled,
      @Value("${app.otp.phone.enabled:false}") boolean phoneEnabled) {
    this.otpRepository = otpRepository;
    this.mailSender = mailSender;
    this.otpLength = otpLength;
    this.expirationMinutes = expirationMinutes;
    this.emailEnabled = emailEnabled;
    this.phoneEnabled = phoneEnabled;
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

    // AWS (SNS) removed. If you want SMS OTP, implement a provider like Twilio.
    throw new IllegalStateException("SMS OTP not configured. Add an SMS provider (e.g. Twilio).");
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
}

