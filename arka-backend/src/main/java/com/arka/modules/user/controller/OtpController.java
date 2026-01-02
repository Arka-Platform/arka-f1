package com.arka.modules.user.controller;

import com.arka.modules.user.service.OtpService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/otp")
public class OtpController {
  private final OtpService otpService;

  public OtpController(OtpService otpService) {
    this.otpService = otpService;
  }

  @PostMapping("/send-email")
  public ResponseEntity<?> sendEmailOtp(@RequestBody SendEmailOtpRequest request) {
    try {
      otpService.sendEmailOtp(request.email());
      return ResponseEntity.ok(java.util.Map.of("message", "OTP sent to email successfully"));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/send-phone")
  public ResponseEntity<?> sendPhoneOtp(@RequestBody SendPhoneOtpRequest request) {
    try {
      otpService.sendPhoneOtp(request.phoneNumber());
      return ResponseEntity.ok(java.util.Map.of("message", "OTP sent to phone successfully"));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/verify")
  public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
    try {
      boolean isValid = otpService.verifyOtp(request.emailOrPhone(), request.otpCode(), request.otpType());
      if (isValid) {
        return ResponseEntity.ok(java.util.Map.of("message", "OTP verified successfully", "valid", true));
      } else {
        return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid or expired OTP", "valid", false));
      }
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    }
  }

  public record SendEmailOtpRequest(
      @NotBlank @Email String email
  ) {}

  public record SendPhoneOtpRequest(
      @NotBlank @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format") String phoneNumber
  ) {}

  public record VerifyOtpRequest(
      @NotBlank String emailOrPhone,
      @NotBlank String otpCode,
      @NotBlank String otpType  // "email" or "phone"
  ) {}
}




