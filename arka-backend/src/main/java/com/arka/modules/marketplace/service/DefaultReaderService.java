package com.arka.modules.marketplace.service;

import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Service to get or create the default reader user.
 * This user is used as the owner for books that have no seller.
 */
@Service
public class DefaultReaderService {
  private static final String DEFAULT_READER_EMAIL = "reader@arka.com";
  
  private final UserRepository userRepository;

  public DefaultReaderService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Get the default reader user ID.
   * Returns null if the user doesn't exist (shouldn't happen after seeder runs).
   */
  public UUID getDefaultReaderId() {
    Optional<UserEntity> reader = userRepository.findByEmail(DEFAULT_READER_EMAIL);
    return reader.map(UserEntity::getId).orElse(null);
  }

  /**
   * Get the default reader user entity.
   */
  public Optional<UserEntity> getDefaultReader() {
    return userRepository.findByEmail(DEFAULT_READER_EMAIL);
  }
}


