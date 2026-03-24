package com.arka.modules.user.service;

import com.arka.modules.user.entity.OtpEntity;
import com.arka.modules.user.repository.OtpRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {
  private static final Logger log = LoggerFactory.getLogger(OtpService.class);
  private static final SecureRandom random = new SecureRandom();

  private final OtpRepository otpRepository;
  private final JavaMailSender mailSender;
  private final PasswordEncoder passwordEncoder;
  private final int otpLength;
  private final int expirationMinutes;
  private final int maxVerifyAttempts;
  private final int lockoutMinutes;
  private final boolean emailEnabled;
  private final boolean phoneEnabled;
  private final Map<String, AttemptState> verifyAttemptState = new ConcurrentHashMap<>();

  public OtpService(
      OtpRepository otpRepository,
      @Autowired(required = false) JavaMailSender mailSender,
      PasswordEncoder passwordEncoder,
      @Value("${app.otp.email.length:6}") int otpLength,
      @Value("${app.otp.email.expiration-minutes:10}") int expirationMinutes,
      @Value("${app.otp.verify.max-attempts:5}") int maxVerifyAttempts,
      @Value("${app.otp.verify.lockout-minutes:15}") int lockoutMinutes,
      @Value("${app.otp.email.enabled:true}") boolean emailEnabled,
      @Value("${app.otp.phone.enabled:false}") boolean phoneEnabled) {
    this.otpRepository = otpRepository;
    this.mailSender = mailSender;
    this.passwordEncoder = passwordEncoder;
    this.otpLength = otpLength;
    this.expirationMinutes = expirationMinutes;
    this.maxVerifyAttempts = maxVerifyAttempts;
    this.lockoutMinutes = lockoutMinutes;
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

    String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
    String otpCode = generateOtp();
    LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

    // Invalidate previous unused OTPs
    otpRepository.findLatestUnusedOtp(normalizedEmail, "email")
        .ifPresent(otp -> otp.setUsed(true));

    // Store hash instead of plaintext OTP to reduce sensitive data exposure.
    String otpHash = passwordEncoder.encode(otpCode);
    OtpEntity otp = new OtpEntity(normalizedEmail, otpHash, "email", expiresAt);
    otpRepository.save(otp);

    // Send email
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setTo(normalizedEmail);
      message.setSubject("Arka - Email Verification Code");
      message.setText("Your verification code is: " + otpCode + "\n\nThis code will expire in " + expirationMinutes + " minutes.");
      mailSender.send(message);
      log.info("OTP sent to email: {}", normalizedEmail);
    } catch (Exception e) {
      log.error("Failed to send OTP email to {}: {}", normalizedEmail, e.getMessage());
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
    String normalizedIdentifier = emailOrPhone == null ? "" : emailOrPhone.trim().toLowerCase(Locale.ROOT);
    String normalizedType = otpType == null ? "" : otpType.trim().toLowerCase(Locale.ROOT);
    String attemptKey = normalizedIdentifier + "|" + normalizedType;

    AttemptState attemptState = verifyAttemptState.computeIfAbsent(attemptKey, _k -> new AttemptState());
    if (attemptState.isLockedOut()) {
      log.warn("OTP verification blocked due to lockout for {}", normalizedIdentifier);
      return false;
    }

    Optional<OtpEntity> otpOpt = otpRepository.findLatestUnusedOtp(normalizedIdentifier, normalizedType);

    if (otpOpt.isEmpty()) {
      attemptState.recordFailure();
      return false;
    }

    OtpEntity otp = otpOpt.get();
    if (otp.isExpired()) {
      attemptState.recordFailure();
      return false;
    }

    if (!passwordEncoder.matches(otpCode, otp.getOtpCode())) {
      attemptState.recordFailure();
      return false;
    }

    // Mark as used
    otp.setUsed(true);
    otpRepository.save(otp);
    verifyAttemptState.remove(attemptKey);
    return true;
  }

  private String generateOtp() {
    StringBuilder otp = new StringBuilder();
    for (int i = 0; i < otpLength; i++) {
      otp.append(random.nextInt(10));
    }
    return otp.toString();
  }

  private class AttemptState {
    private int failedAttempts;
    private LocalDateTime lockedUntil;

    void recordFailure() {
      if (isLockedOut()) {
        return;
      }
      failedAttempts++;
      if (failedAttempts >= maxVerifyAttempts) {
        lockedUntil = LocalDateTime.now().plusMinutes(lockoutMinutes);
        failedAttempts = 0;
      }
    }

    boolean isLockedOut() {
      if (lockedUntil == null) {
        return false;
      }
      if (LocalDateTime.now().isAfter(lockedUntil)) {
        lockedUntil = null;
        failedAttempts = 0;
        return false;
      }
      return true;
    }
  }
}

