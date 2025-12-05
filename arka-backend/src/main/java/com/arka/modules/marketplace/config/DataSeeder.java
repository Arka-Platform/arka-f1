package com.arka.modules.marketplace.config;

import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class DataSeeder {
  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
  private final BookRepository bookRepository;
  private final UUID defaultOwnerId = UUID.fromString("00000000-0000-0000-0000-000000000000");

  @Value("${app.seed-data.enabled:true}")
  private boolean seedDataEnabled;

  @Value("${app.seed-data.sample-enabled:false}")
  private boolean sampleSeedEnabled;

  public DataSeeder(BookRepository bookRepository) {
    this.bookRepository = bookRepository;
  }

  @PostConstruct
  public void seedData() {
    if (!seedDataEnabled || !sampleSeedEnabled) {
      log.info("Data seeding is disabled");
      return;
    }

    if (bookRepository.count() > 0) {
      log.info("Database already contains data, skipping seed");
      return;
    }

    log.info("Seeding sample books...");

    // Competitive Exams - UPSC
    createBook("Indian Polity by M. Laxmikanth", "M. Laxmikanth", 
        "Comprehensive guide to Indian Constitution and Polity for UPSC preparation.", 
        "Non-Fiction", "Competitive Exams", "UPSC", new BigDecimal("25.00"));
    
    createBook("History of Modern India", "Bipan Chandra", 
        "Essential reading for UPSC History paper covering modern Indian history.", 
        "Non-Fiction", "Competitive Exams", "UPSC", new BigDecimal("22.00"));
    
    createBook("Geography of India", "Majid Husain", 
        "Complete geography textbook for UPSC Prelims and Mains.", 
        "Non-Fiction", "Competitive Exams", "UPSC", new BigDecimal("20.00"));
    
    createBook("Environment and Ecology", "Shankar IAS", 
        "Comprehensive guide for UPSC Environment and Ecology paper.", 
        "Non-Fiction", "Competitive Exams", "UPSC", new BigDecimal("18.00"));

    // Competitive Exams - CAT
    createBook("How to Prepare for Quantitative Aptitude", "Arun Sharma", 
        "Complete guide for CAT quantitative aptitude section.", 
        "Non-Fiction", "Competitive Exams", "CAT", new BigDecimal("30.00"));
    
    createBook("How to Prepare for Data Interpretation", "Arun Sharma", 
        "Essential book for CAT DI section with practice problems.", 
        "Non-Fiction", "Competitive Exams", "CAT", new BigDecimal("28.00"));
    
    createBook("How to Prepare for Verbal Ability", "Arun Sharma", 
        "Comprehensive guide for CAT verbal ability and reading comprehension.", 
        "Non-Fiction", "Competitive Exams", "CAT", new BigDecimal("26.00"));

    // Competitive Exams - GATE
    createBook("GATE Computer Science and IT", "Made Easy Publications", 
        "Complete study material for GATE CSE with previous year papers.", 
        "Non-Fiction", "Competitive Exams", "GATE", new BigDecimal("35.00"));
    
    createBook("GATE Mechanical Engineering", "Made Easy Publications", 
        "Comprehensive guide for GATE Mechanical Engineering.", 
        "Non-Fiction", "Competitive Exams", "GATE", new BigDecimal("35.00"));
    
    createBook("GATE Electrical Engineering", "Made Easy Publications", 
        "Complete study material for GATE Electrical Engineering.", 
        "Non-Fiction", "Competitive Exams", "GATE", new BigDecimal("35.00"));

    // Fiction
    createBook("The Great Gatsby", "F. Scott Fitzgerald", 
        "A classic American novel about the Jazz Age and the American Dream.", 
        "Fiction", null, null, new BigDecimal("15.00"));
    
    createBook("1984", "George Orwell", 
        "A dystopian social science fiction novel about totalitarian control.", 
        "Fiction", new BigDecimal("12.50"));
    
    createBook("To Kill a Mockingbird", "Harper Lee", 
        "A coming-of-age story dealing with racial inequality in the American South.", 
        "Fiction", new BigDecimal("14.00"));
    
    createBook("Pride and Prejudice", "Jane Austen", 
        "A romantic novel of manners about Elizabeth Bennet and Mr. Darcy.", 
        "Fiction", new BigDecimal("13.00"));
    
    createBook("The Catcher in the Rye", "J.D. Salinger", 
        "A controversial novel about teenage rebellion and alienation.", 
        "Fiction", new BigDecimal("11.50"));

    // Science Fiction
    createBook("Dune", "Frank Herbert", 
        "An epic science fiction novel set on the desert planet Arrakis.", 
        "Science Fiction", new BigDecimal("18.00"));
    
    createBook("The Hitchhiker's Guide to the Galaxy", "Douglas Adams", 
        "A comedic science fiction series about space travel and absurdity.", 
        "Science Fiction", new BigDecimal("16.00"));
    
    createBook("Neuromancer", "William Gibson", 
        "A groundbreaking cyberpunk novel about artificial intelligence.", 
        "Science Fiction", new BigDecimal("17.50"));

    // Mystery/Thriller
    createBook("The Girl with the Dragon Tattoo", "Stieg Larsson", 
        "A psychological thriller about a journalist and a hacker solving a mystery.", 
        "Mystery", new BigDecimal("15.50"));
    
    createBook("Gone Girl", "Gillian Flynn", 
        "A psychological thriller about a marriage gone wrong.", 
        "Thriller", new BigDecimal("16.50"));
    
    createBook("The Da Vinci Code", "Dan Brown", 
        "A mystery thriller involving secret societies and religious history.", 
        "Mystery", new BigDecimal("14.50"));

    // Non-Fiction
    createBook("Sapiens", "Yuval Noah Harari", 
        "A brief history of humankind from the Stone Age to the present.", 
        "Non-Fiction", new BigDecimal("20.00"));
    
    createBook("Educated", "Tara Westover", 
        "A memoir about a woman who grows up in a survivalist family.", 
        "Biography", new BigDecimal("18.50"));
    
    createBook("The Immortal Life of Henrietta Lacks", "Rebecca Skloot", 
        "The story of how one woman's cells changed medical science.", 
        "Non-Fiction", new BigDecimal("19.00"));

    // Fantasy
    createBook("The Lord of the Rings", "J.R.R. Tolkien", 
        "An epic high fantasy novel about the quest to destroy the One Ring.", 
        "Fantasy", new BigDecimal("22.00"));
    
    createBook("Harry Potter and the Philosopher's Stone", "J.K. Rowling", 
        "The first book in the magical series about a young wizard.", 
        "Fantasy", new BigDecimal("16.00"));
    
    createBook("A Game of Thrones", "George R.R. Martin", 
        "The first book in the epic fantasy series A Song of Ice and Fire.", 
        "Fantasy", new BigDecimal("21.00"));

    // Romance
    createBook("The Notebook", "Nicholas Sparks", 
        "A romantic novel about a couple's enduring love story.", 
        "Romance", new BigDecimal("13.50"));
    
    createBook("Outlander", "Diana Gabaldon", 
        "A time-traveling romance set in 18th-century Scotland.", 
        "Romance", new BigDecimal("17.00"));

    // Horror
    createBook("The Shining", "Stephen King", 
        "A psychological horror novel about a family in an isolated hotel.", 
        "Horror", new BigDecimal("15.00"));
    
    createBook("Dracula", "Bram Stoker", 
        "The classic gothic horror novel about the vampire Count Dracula.", 
        "Horror", new BigDecimal("14.00"));

    // Historical Fiction
    createBook("The Book Thief", "Markus Zusak", 
        "A story set in Nazi Germany, narrated by Death.", 
        "Historical Fiction", new BigDecimal("16.50"));
    
    createBook("All the Light We Cannot See", "Anthony Doerr", 
        "A World War II novel about a blind French girl and a German boy.", 
        "Historical Fiction", new BigDecimal("18.00"));

    log.info("Successfully seeded {} books", bookRepository.count());
  }

  private void createBook(String title, String author, String description, String genre, BigDecimal price) {
    createBook(title, author, description, genre, null, null, price);
  }

  private void createBook(String title, String author, String description, String genre, 
                          String category, String subcategory, BigDecimal price) {
    BookEntity book = new BookEntity(title, author, description, genre, category, subcategory, price, defaultOwnerId);
    book.setStatus(BookStatus.PUBLISHED);
    bookRepository.save(book);
  }
}

