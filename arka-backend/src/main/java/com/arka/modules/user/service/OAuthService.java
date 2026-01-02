package com.arka.modules.user.service;

import com.arka.config.JwtService;
import com.arka.modules.user.dto.AuthResponse;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.util.Optional;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuthService {
  private final UserRepository userRepository;
  private final JwtService jwtService;

  public OAuthService(UserRepository userRepository, JwtService jwtService) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
  }

  /**
   * Process OAuth2 login (e.g., Google)
   */
  @Transactional
  public AuthResponse processOAuthLogin(OAuth2User oauth2User, String provider) {
    String email = oauth2User.getAttribute("email");
    String firstName = oauth2User.getAttribute("given_name");
    String lastName = oauth2User.getAttribute("family_name");
    String providerId = oauth2User.getName(); // OAuth provider's user ID

    if (email == null) {
      throw new IllegalArgumentException("Email not provided by OAuth provider");
    }

    // Find existing user by email or OAuth provider ID
    Optional<UserEntity> existingUser = userRepository.findByEmail(email);
    
    UserEntity user;
    if (existingUser.isPresent()) {
      user = existingUser.get();
      // Update OAuth info if not set
      if (user.getOauthProvider() == null) {
        user.setOauthProvider(provider);
        user.setOauthProviderId(providerId);
      }
      // Mark email as verified for OAuth users
      user.setEmailVerified(true);
    } else {
      // Create new user - use a default password that will never be used
      // Since passwordHash is nullable, we can set it to null
      user = new UserEntity(
          email,
          firstName != null ? firstName : "User",
          lastName != null ? lastName : "",
          null  // No password for OAuth users
      );
      user.setOauthProvider(provider);
      user.setOauthProviderId(providerId);
      user.setEmailVerified(true);
    }

    user = userRepository.save(user);

    String token = jwtService.generateToken(user.getId(), user.getEmail());
    return new AuthResponse(
        token,
        user.getId(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName()
    );
  }
}

