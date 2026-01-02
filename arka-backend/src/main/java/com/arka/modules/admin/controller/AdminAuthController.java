package com.arka.modules.admin.controller;

import com.arka.modules.user.dto.AuthResponse;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import com.arka.config.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin authentication controller.
 * Only allows login for users with isAdmin = true
 */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AdminAuthController(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    String password = request.get("password");

    if (email == null || password == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
    }

    UserEntity user = userRepository.findByEmail(email)
        .orElse(null);

    if (user == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    // Check if user is admin
    if (user.getIsAdmin() == null || !user.getIsAdmin()) {
      return ResponseEntity.status(403).body(Map.of("error", "Access denied. Admin credentials required."));
    }

    // Check password
    if (user.getPasswordHash() == null) {
      return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    // Generate token
    String token = jwtService.generateToken(user.getId(), user.getEmail());
    AuthResponse response = new AuthResponse(
        token,
        user.getId(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName()
    );

    return ResponseEntity.ok(response);
  }
}


