package com.arka.modules.user.controller;

import com.arka.modules.user.service.OtpService;
import com.arka.modules.user.service.UserService;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/verification")
public class VerificationController {
  private final OtpService otpService;
  private final UserService userService;

  public VerificationController(OtpService otpService, UserService userService) {
    this.otpService = otpService;
    this.userService = userService;
  }

  @PostMapping("/verify-email")
  public ResponseEntity<?> verifyEmail(
      @RequestBody VerifyEmailRequest request) {
    try {
      boolean isValid = otpService.verifyOtp(request.email(), request.otpCode(), "email");
      if (isValid) {
        userService.verifyEmail(request.userId());
        return ResponseEntity.ok(java.util.Map.of("message", "Email verified successfully"));
      } else {
        return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired OTP"));
      }
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/verify-phone")
  public ResponseEntity<?> verifyPhone(
      @RequestBody VerifyPhoneRequest request) {
    try {
      boolean isValid = otpService.verifyOtp(request.phoneNumber(), request.otpCode(), "phone");
      if (isValid) {
        userService.verifyPhone(request.userId());
        return ResponseEntity.ok(java.util.Map.of("message", "Phone verified successfully"));
      } else {
        return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired OTP"));
      }
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    }
  }

  public record VerifyEmailRequest(
      UUID userId,
      @NotBlank String email,
      @NotBlank String otpCode
  ) {}

  public record VerifyPhoneRequest(
      UUID userId,
      @NotBlank String phoneNumber,
      @NotBlank String otpCode
  ) {}
}

