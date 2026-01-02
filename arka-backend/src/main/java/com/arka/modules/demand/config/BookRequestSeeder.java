package com.arka.modules.demand.config;

import com.arka.modules.demand.entity.BookRequestEntity;
import com.arka.modules.demand.entity.BookRequestStatus;
import com.arka.modules.demand.repository.BookRequestRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder to create sample book requests (open and recently served) for testing.
 * 
 * This creates:
 * - 5-10 open requests
 * - 5-10 recently served (fulfilled/completed) requests
 */
@Component
@Order(3) // Run after DefaultReaderSeeder
public class BookRequestSeeder implements CommandLineRunner {
  private final BookRequestRepository requestRepository;
  private final UserRepository userRepository;

  public BookRequestSeeder(
      BookRequestRepository requestRepository,
      UserRepository userRepository) {
    this.requestRepository = requestRepository;
    this.userRepository = userRepository;
  }

  @Override
  @Transactional
  public void run(String... args) {
    // Get or create sample users
    List<UserEntity> users = userRepository.findAll();
    if (users.isEmpty()) {
      System.out.println("No users found. Skipping book request seeding.");
      return;
    }

    // Use first few users as requesters
    UserEntity requester1 = users.get(0);
    UserEntity requester2 = users.size() > 1 ? users.get(1) : requester1;
    UserEntity requester3 = users.size() > 2 ? users.get(2) : requester1;
    UserEntity fulfiller1 = users.size() > 1 ? users.get(1) : requester1;
    UserEntity fulfiller2 = users.size() > 2 ? users.get(2) : requester1;

    // Check if requests already exist
    if (requestRepository.count() > 0) {
      System.out.println("Book requests already exist. Skipping seeding.");
      return;
    }

    int createdCount = 0;

    // Create OPEN requests
    List<BookRequestEntity> openRequests = List.of(
        createRequest(
            requester1.getId(),
            "The Great Gatsby",
            "F. Scott Fitzgerald",
            "Looking for a classic American novel in good condition",
            "Fiction",
            "Classic Literature",
            null,
            new BigDecimal("500.00"),
            "GOOD",
            "MEDIUM",
            "Mumbai",
            "Prefer paperback edition",
            BookRequestStatus.OPEN,
            null,
            null,
            null
        ),
        createRequest(
            requester2.getId(),
            "To Kill a Mockingbird",
            "Harper Lee",
            "Need for school project",
            "Fiction",
            "Classic Literature",
            null,
            new BigDecimal("400.00"),
            "ANY",
            "HIGH",
            "Delhi",
            "Urgent - needed by next week",
            BookRequestStatus.OPEN,
            null,
            null,
            null
        ),
        createRequest(
            requester3.getId(),
            "1984",
            "George Orwell",
            "Interested in dystopian fiction",
            "Fiction",
            "Science Fiction",
            "978-0451524935",
            new BigDecimal("450.00"),
            "LIKE_NEW",
            "LOW",
            "Bangalore",
            null,
            BookRequestStatus.OPEN,
            null,
            null,
            null
        ),
        createRequest(
            requester1.getId(),
            "Pride and Prejudice",
            "Jane Austen",
            "Classic romance novel",
            "Fiction",
            "Romance",
            null,
            new BigDecimal("350.00"),
            "GOOD",
            "MEDIUM",
            "Chennai",
            null,
            BookRequestStatus.OPEN,
            null,
            null,
            null
        ),
        createRequest(
            requester2.getId(),
            "The Catcher in the Rye",
            "J.D. Salinger",
            "Coming of age novel",
            "Fiction",
            "Literary Fiction",
            null,
            new BigDecimal("400.00"),
            "ANY",
            "LOW",
            "Pune",
            null,
            BookRequestStatus.OPEN,
            null,
            null,
            null
        ),
        createRequest(
            requester3.getId(),
            "Sapiens: A Brief History of Humankind",
            "Yuval Noah Harari",
            "Non-fiction book about human history",
            "Non-Fiction",
            "History",
            "978-0062316097",
            new BigDecimal("600.00"),
            "GOOD",
            "MEDIUM",
            "Hyderabad",
            null,
            BookRequestStatus.OPEN,
            null,
            null,
            null
        )
    );

    for (BookRequestEntity request : openRequests) {
      requestRepository.save(request);
      createdCount++;
    }

    // Create RECENTLY SERVED (FULFILLED/COMPLETED) requests
    Instant now = Instant.now();
    Instant oneDayAgo = now.minusSeconds(24 * 60 * 60);
    Instant twoDaysAgo = now.minusSeconds(2 * 24 * 60 * 60);
    Instant threeDaysAgo = now.minusSeconds(3 * 24 * 60 * 60);
    Instant fourDaysAgo = now.minusSeconds(4 * 24 * 60 * 60);
    Instant fiveDaysAgo = now.minusSeconds(5 * 24 * 60 * 60);

    List<BookRequestEntity> servedRequests = List.of(
        createRequest(
            requester1.getId(),
            "The Alchemist",
            "Paulo Coelho",
            "Inspirational fiction",
            "Fiction",
            "Philosophical Fiction",
            null,
            new BigDecimal("300.00"),
            "GOOD",
            "MEDIUM",
            "Mumbai",
            null,
            BookRequestStatus.COMPLETED,
            fulfiller1.getId(),
            fulfiller1.getFirstName() + " " + fulfiller1.getLastName(),
            oneDayAgo
        ),
        createRequest(
            requester2.getId(),
            "Atomic Habits",
            "James Clear",
            "Self-help book on building good habits",
            "Non-Fiction",
            "Self-Help",
            "978-0735211292",
            new BigDecimal("550.00"),
            "LIKE_NEW",
            "HIGH",
            "Delhi",
            null,
            BookRequestStatus.COMPLETED,
            fulfiller2.getId(),
            fulfiller2.getFirstName() + " " + fulfiller2.getLastName(),
            twoDaysAgo
        ),
        createRequest(
            requester3.getId(),
            "The Subtle Art of Not Giving a F*ck",
            "Mark Manson",
            "Self-help book",
            "Non-Fiction",
            "Self-Help",
            null,
            new BigDecimal("500.00"),
            "GOOD",
            "MEDIUM",
            "Bangalore",
            null,
            BookRequestStatus.FULFILLED,
            fulfiller1.getId(),
            fulfiller1.getFirstName() + " " + fulfiller1.getLastName(),
            threeDaysAgo
        ),
        createRequest(
            requester1.getId(),
            "The Seven Husbands of Evelyn Hugo",
            "Taylor Jenkins Reid",
            "Historical fiction",
            "Fiction",
            "Historical Fiction",
            null,
            new BigDecimal("450.00"),
            "LIKE_NEW",
            "LOW",
            "Chennai",
            null,
            BookRequestStatus.COMPLETED,
            fulfiller2.getId(),
            fulfiller2.getFirstName() + " " + fulfiller2.getLastName(),
            fourDaysAgo
        ),
        createRequest(
            requester2.getId(),
            "Project Hail Mary",
            "Andy Weir",
            "Science fiction novel",
            "Fiction",
            "Science Fiction",
            "978-0593135204",
            new BigDecimal("600.00"),
            "GOOD",
            "MEDIUM",
            "Pune",
            null,
            BookRequestStatus.COMPLETED,
            fulfiller1.getId(),
            fulfiller1.getFirstName() + " " + fulfiller1.getLastName(),
            fiveDaysAgo
        ),
        createRequest(
            requester3.getId(),
            "Educated",
            "Tara Westover",
            "Memoir",
            "Non-Fiction",
            "Biography",
            null,
            new BigDecimal("500.00"),
            "GOOD",
            "HIGH",
            "Hyderabad",
            null,
            BookRequestStatus.FULFILLED,
            fulfiller2.getId(),
            fulfiller2.getFirstName() + " " + fulfiller2.getLastName(),
            oneDayAgo.minusSeconds(12 * 60 * 60) // 12 hours ago
        ),
        createRequest(
            requester1.getId(),
            "The Midnight Library",
            "Matt Haig",
            "Philosophical fiction",
            "Fiction",
            "Philosophical Fiction",
            null,
            new BigDecimal("400.00"),
            "LIKE_NEW",
            "MEDIUM",
            "Mumbai",
            null,
            BookRequestStatus.COMPLETED,
            fulfiller1.getId(),
            fulfiller1.getFirstName() + " " + fulfiller1.getLastName(),
            twoDaysAgo.minusSeconds(6 * 60 * 60) // 2.25 days ago
        ),
        createRequest(
            requester2.getId(),
            "Dune",
            "Frank Herbert",
            "Epic science fiction",
            "Fiction",
            "Science Fiction",
            "978-0441013593",
            new BigDecimal("650.00"),
            "GOOD",
            "LOW",
            "Delhi",
            null,
            BookRequestStatus.COMPLETED,
            fulfiller2.getId(),
            fulfiller2.getFirstName() + " " + fulfiller2.getLastName(),
            threeDaysAgo.minusSeconds(8 * 60 * 60) // 3.33 days ago
        )
    );

    for (BookRequestEntity request : servedRequests) {
      requestRepository.save(request);
      createdCount++;
    }

    System.out.println("==========================================");
    System.out.println("BOOK REQUEST SEEDER COMPLETED");
    System.out.println("Created " + createdCount + " sample book requests:");
    System.out.println("  - " + openRequests.size() + " OPEN requests");
    System.out.println("  - " + servedRequests.size() + " RECENTLY SERVED requests");
    System.out.println("==========================================");
  }

  private BookRequestEntity createRequest(
      UUID requesterId,
      String title,
      String author,
      String description,
      String genre,
      String category,
      String isbn,
      BigDecimal maxPrice,
      String preferredCondition,
      String urgency,
      String location,
      String additionalNotes,
      BookRequestStatus status,
      UUID fulfilledBy,
      String fulfilledByName,
      Instant fulfilledAt) {
    
    BookRequestEntity request = new BookRequestEntity(requesterId, title, author);
    request.setDescription(description);
    request.setGenre(genre);
    request.setCategory(category);
    request.setIsbn(isbn);
    request.setMaxPrice(maxPrice);
    request.setPreferredCondition(preferredCondition);
    request.setUrgency(urgency);
    request.setLocation(location);
    request.setAdditionalNotes(additionalNotes);
    request.setStatus(status);
    request.setExpiresAt(Instant.now().plusSeconds(30 * 24 * 60 * 60)); // 30 days from now
    request.setViewsCount(0);
    request.setOffersCount(0);
    
    if (fulfilledBy != null) {
      request.setFulfilledBy(fulfilledBy);
    }
    if (fulfilledAt != null) {
      request.setFulfilledAt(fulfilledAt);
    }
    
    return request;
  }
}

