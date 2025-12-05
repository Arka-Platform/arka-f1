package com.arka.modules.user.service;

import com.arka.common.exception.ResourceNotFoundException;
import com.arka.config.JwtService;
import com.arka.modules.marketplace.entity.CreditTransactionEntity;
import com.arka.modules.marketplace.repository.CreditTransactionRepository;
import com.arka.modules.user.dto.AuthResponse;
import com.arka.modules.user.dto.LoginRequest;
import com.arka.modules.user.dto.RegisterRequest;
import com.arka.modules.user.dto.UserResponse;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final CreditTransactionRepository creditTransactionRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public UserService(
      UserRepository userRepository,
      CreditTransactionRepository creditTransactionRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService) {
    this.userRepository = userRepository;
    this.creditTransactionRepository = creditTransactionRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  /**
   * Get user's credit balance
   */
  public BigDecimal getCreditBalance(UUID userId) {
    return userRepository.findById(userId)
        .map(UserEntity::getCreditBalance)
        .orElse(BigDecimal.ZERO);
  }

  /**
   * Get user's credit transaction history
   */
  public List<CreditTransactionEntity> getCreditHistory(UUID userId) {
    return creditTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
  }

  /**
   * Get user profile information
   */
  public UserEntity getUserProfile(UUID userId) {
    return userRepository.findById(userId).orElse(null);
  }

  /**
   * Get profile message
   */
  public String profileMessage() {
    return "User profile endpoint";
  }

  /**
   * Register a new user
   */
  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new IllegalArgumentException("Email already exists");
    }

    String passwordHash = passwordEncoder.encode(request.password());
    UserEntity user = new UserEntity(
        request.email(),
        request.firstName(),
        request.lastName(),
        passwordHash
    );
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

  /**
   * Login user
   */
  public AuthResponse login(LoginRequest request) {
    UserEntity user = userRepository.findByEmail(request.email())
        .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid email or password");
    }

    String token = jwtService.generateToken(user.getId(), user.getEmail());
    return new AuthResponse(
        token,
        user.getId(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName()
    );
  }

  /**
   * Get user by ID
   */
  public UserResponse getUserById(UUID userId) {
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    return new UserResponse(
        user.getId(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName(),
        user.getCreditBalance()
    );
  }

  /**
   * Update user profile
   */
  @Transactional
  public UserResponse updateUser(UUID userId, com.arka.modules.user.dto.UpdateUserRequest request) {
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (request.firstName() != null && !request.firstName().trim().isEmpty()) {
      user.setFirstName(request.firstName().trim());
    }
    if (request.lastName() != null && !request.lastName().trim().isEmpty()) {
      user.setLastName(request.lastName().trim());
    }
    if (request.email() != null && !request.email().trim().isEmpty()) {
      // Check if email is already taken by another user
      if (userRepository.existsByEmail(request.email().trim()) && 
          !user.getEmail().equals(request.email().trim())) {
        throw new IllegalArgumentException("Email already exists");
      }
      user.setEmail(request.email().trim());
    }

    UserEntity saved = userRepository.save(user);
    return new UserResponse(
        saved.getId(),
        saved.getEmail(),
        saved.getFirstName(),
        saved.getLastName(),
        saved.getCreditBalance()
    );
  }
}















