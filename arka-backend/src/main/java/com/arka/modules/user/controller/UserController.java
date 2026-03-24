package com.arka.modules.user.controller;

import com.arka.modules.user.dto.AuthResponse;
import com.arka.modules.user.dto.LoginRequest;
import com.arka.modules.user.dto.RegisterRequest;
import com.arka.modules.user.dto.UserResponse;
import com.arka.modules.user.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    AuthResponse response = userService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthResponse response = userService.login(request);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getUserById(
      @PathVariable UUID id,
      Authentication authentication,
      @org.springframework.security.core.annotation.AuthenticationPrincipal String authenticatedUserId) {
    UUID requesterId = UUID.fromString(authenticatedUserId);
    boolean isAdmin = authentication != null
        && authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    if (!isAdmin && !requesterId.equals(id)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(java.util.Map.of("error", "Forbidden"));
    }
    UserResponse user = userService.getUserById(id);
    return ResponseEntity.ok(user);
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> updateUser(
      @PathVariable UUID id,
      Authentication authentication,
      @org.springframework.security.core.annotation.AuthenticationPrincipal String authenticatedUserId,
      @Valid @RequestBody com.arka.modules.user.dto.UpdateUserRequest request) {
    UUID requesterId = UUID.fromString(authenticatedUserId);
    boolean isAdmin = authentication != null
        && authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    if (!isAdmin && !requesterId.equals(id)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN)
          .body(java.util.Map.of("error", "Forbidden"));
    }
    try {
      UserResponse user = userService.updateUser(id, request);
      return ResponseEntity.ok(user);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
    } catch (com.arka.common.exception.ResourceNotFoundException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/profile")
  public ResponseEntity<String> profile() {
    return ResponseEntity.ok(userService.profileMessage());
  }
}
























