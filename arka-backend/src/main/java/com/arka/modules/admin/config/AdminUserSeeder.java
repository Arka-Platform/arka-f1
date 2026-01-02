package com.arka.modules.admin.config;

import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates a default admin user if one doesn't exist.
 * 
 * Default Admin Credentials:
 * Email: admin@arka.com
 * Password: ArkaAdmin2024!
 * 
 * IMPORTANT: Change this password immediately after first login!
 */
@Component
public class AdminUserSeeder implements CommandLineRunner {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public AdminUserSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(String... args) {
    String adminEmail = "admin@arka.com";
    
    // Check if admin user already exists
    if (userRepository.findByEmail(adminEmail).isEmpty()) {
      String passwordHash = passwordEncoder.encode("ArkaAdmin2024!");
      
      UserEntity admin = new UserEntity(
          adminEmail,
          "Arka",
          "Admin",
          passwordHash
      );
      admin.setIsAdmin(true);
      admin.setEmailVerified(true);
      
      userRepository.save(admin);
      System.out.println("==========================================");
      System.out.println("ADMIN USER CREATED");
      System.out.println("Email: " + adminEmail);
      System.out.println("Password: ArkaAdmin2024!");
      System.out.println("IMPORTANT: Change password after first login!");
      System.out.println("==========================================");
    } else {
      // Check if existing user is admin, if not, make them admin
      UserEntity existingUser = userRepository.findByEmail(adminEmail).get();
      if (existingUser.getIsAdmin() == null || !existingUser.getIsAdmin()) {
        existingUser.setIsAdmin(true);
        userRepository.save(existingUser);
        System.out.println("Existing user " + adminEmail + " has been granted admin access.");
      }
    }
  }
}


