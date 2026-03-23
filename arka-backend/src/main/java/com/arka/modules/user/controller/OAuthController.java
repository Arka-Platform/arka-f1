package com.arka.modules.user.controller;

import com.arka.modules.user.dto.AuthResponse;
import com.arka.modules.user.service.OAuthService;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class OAuthController {
  private final OAuthService oauthService;
  private final String frontendUrl;

  public OAuthController(
      OAuthService oauthService,
      @Value("${FRONTEND_URL:http://localhost:5173}") String frontendUrl) {
    this.oauthService = oauthService;
    this.frontendUrl = frontendUrl;
  }

  /**
   * OAuth2 callback endpoint for Google
   */
  @GetMapping("/oauth2/callback/google")
  public void googleCallback(
      @AuthenticationPrincipal OAuth2User oauth2User,
      HttpServletResponse response) throws IOException {
    try {
      AuthResponse authResponse = oauthService.processOAuthLogin(oauth2User, "google");

      response.sendRedirect(frontendUrl + "/auth/callback?token=" + authResponse.token() + 
          "&userId=" + authResponse.userId() + 
          "&email=" + authResponse.email());
    } catch (Exception e) {
      response.sendRedirect(frontendUrl + "/auth/error?message=" + 
          URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
    }
  }

  /**
   * Get OAuth2 login URL
   */
  @GetMapping("/oauth2/authorization/google")
  public ResponseEntity<?> getGoogleAuthUrl() {
    // Spring Security OAuth2 will handle the redirect
    return ResponseEntity.ok(java.util.Map.of(
        "url", "/oauth2/authorization/google"
    ));
  }
}

