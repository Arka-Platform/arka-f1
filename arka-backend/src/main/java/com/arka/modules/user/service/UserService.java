package com.arka.modules.user.service;

import com.arka.modules.marketplace.entity.CreditTransactionEntity;
import com.arka.modules.marketplace.repository.CreditTransactionRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final CreditTransactionRepository creditTransactionRepository;

  public UserService(UserRepository userRepository, CreditTransactionRepository creditTransactionRepository) {
    this.userRepository = userRepository;
    this.creditTransactionRepository = creditTransactionRepository;
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
}















