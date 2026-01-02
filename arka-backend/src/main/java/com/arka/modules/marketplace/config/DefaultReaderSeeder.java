package com.arka.modules.marketplace.config;

import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates a default reader/seller user and assigns all books with no owner to this user.
 * 
 * Default Reader Credentials:
 * Email: reader@arka.com
 * Password: ArkaReader2024!
 * 
 * This user will be the owner of all books that have no seller assigned.
 */
@Component
@Order(2) // Run after AdminUserSeeder (which has @Order(1) or default)
public class DefaultReaderSeeder implements CommandLineRunner {
  private final UserRepository userRepository;
  private final BookRepository bookRepository;
  private final PasswordEncoder passwordEncoder;

  public DefaultReaderSeeder(
      UserRepository userRepository,
      BookRepository bookRepository,
      PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.bookRepository = bookRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(String... args) {
    String readerEmail = "reader@arka.com";
    UUID defaultReaderId;
    
    // Create or get default reader user
    UserEntity defaultReader = userRepository.findByEmail(readerEmail).orElse(null);
    
    if (defaultReader == null) {
      String passwordHash = passwordEncoder.encode("ArkaReader2024!");
      
      defaultReader = new UserEntity(
          readerEmail,
          "Arka",
          "Reader",
          passwordHash
      );
      defaultReader.setEmailVerified(true);
      defaultReader = userRepository.save(defaultReader);
      
      System.out.println("==========================================");
      System.out.println("DEFAULT READER USER CREATED");
      System.out.println("Email: " + readerEmail);
      System.out.println("Password: ArkaReader2024!");
      System.out.println("==========================================");
    }
    
    defaultReaderId = defaultReader.getId();
    
    // Find all books with null ownerId and assign them to default reader
    List<BookEntity> booksWithoutOwner = bookRepository.findAll().stream()
        .filter(book -> book.getOwnerId() == null)
        .toList();
    
    if (!booksWithoutOwner.isEmpty()) {
      int count = 0;
      for (BookEntity book : booksWithoutOwner) {
        book.setOwnerId(defaultReaderId);
        bookRepository.save(book);
        count++;
      }
      
      System.out.println("==========================================");
      System.out.println("ASSIGNED " + count + " BOOK(S) TO DEFAULT READER");
      System.out.println("All books without an owner are now owned by: " + readerEmail);
      System.out.println("==========================================");
    }
  }
}

