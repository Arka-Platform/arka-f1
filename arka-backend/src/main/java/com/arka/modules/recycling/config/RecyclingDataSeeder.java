package com.arka.modules.recycling.config;

import com.arka.modules.recycling.entity.WastePaperEntity;
import com.arka.modules.recycling.entity.WastePaperStatus;
import com.arka.modules.recycling.repository.WastePaperRepository;
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
public class RecyclingDataSeeder {
  private static final Logger log = LoggerFactory.getLogger(RecyclingDataSeeder.class);
  private final WastePaperRepository repository;
  private final UUID defaultOwnerId = UUID.fromString("00000000-0000-0000-0000-000000000000");

  @Value("${app.seed-data.enabled:true}")
  private boolean seedDataEnabled;

  public RecyclingDataSeeder(WastePaperRepository repository) {
    this.repository = repository;
  }

  @PostConstruct
  public void seedData() {
    if (!seedDataEnabled) {
      log.info("Recycling data seeding is disabled");
      return;
    }

    if (repository.count() > 0) {
      log.info("Recycling database already contains data, skipping seed");
      return;
    }

    log.info("Seeding sample waste paper data...");

    // Newspaper
    createWastePaper("Old Newspapers Collection", 
        "A collection of newspapers from the past 3 months, well-preserved and dry.", 
        "Newspaper", new BigDecimal("12.5"), new BigDecimal("5.00"));
    
    createWastePaper("Sunday Edition Newspapers", 
        "Complete Sunday editions including supplements and magazines.", 
        "Newspaper", new BigDecimal("8.0"), new BigDecimal("3.20"));

    // Magazine
    createWastePaper("National Geographic Collection", 
        "A collection of National Geographic magazines from 2020-2023.", 
        "Magazine", new BigDecimal("15.0"), new BigDecimal("7.50"));
    
    createWastePaper("Fashion Magazines Bundle", 
        "Various fashion and lifestyle magazines in good condition.", 
        "Magazine", new BigDecimal("10.0"), new BigDecimal("5.00"));
    
    createWastePaper("Tech Magazines Stack", 
        "Technology and computer magazines from recent years.", 
        "Magazine", new BigDecimal("12.0"), new BigDecimal("6.00"));

    // Office Paper
    createWastePaper("Office Printer Paper", 
        "Clean white office paper from printer, suitable for recycling.", 
        "Office Paper", new BigDecimal("25.0"), new BigDecimal("12.50"));
    
    createWastePaper("Shredded Documents", 
        "Securely shredded office documents, ready for recycling.", 
        "Office Paper", new BigDecimal("18.0"), new BigDecimal("9.00"));
    
    createWastePaper("Used Notebooks", 
        "College-ruled notebooks with some used pages, covers removed.", 
        "Office Paper", new BigDecimal("20.0"), new BigDecimal("10.00"));

    // Cardboard
    createWastePaper("Cardboard Boxes Collection", 
        "Flattened cardboard boxes from recent moves, clean and dry.", 
        "Cardboard", new BigDecimal("30.0"), new BigDecimal("15.00"));
    
    createWastePaper("Shipping Boxes", 
        "Amazon and other shipping boxes, flattened and ready.", 
        "Cardboard", new BigDecimal("22.0"), new BigDecimal("11.00"));
    
    createWastePaper("Pizza Boxes", 
        "Clean pizza boxes without food residue, flattened.", 
        "Cardboard", new BigDecimal("15.0"), new BigDecimal("7.50"));

    // Books (for recycling)
    createWastePaper("Old Textbooks", 
        "Outdated textbooks from college, covers removed.", 
        "Books", new BigDecimal("35.0"), new BigDecimal("17.50"));
    
    createWastePaper("Damaged Paperbacks", 
        "Paperbacks with damaged covers, pages still intact.", 
        "Books", new BigDecimal("28.0"), new BigDecimal("14.00"));

    // Mixed Paper
    createWastePaper("Mixed Paper Collection", 
        "Assorted paper products including envelopes, flyers, and brochures.", 
        "Mixed Paper", new BigDecimal("40.0"), new BigDecimal("20.00"));
    
    createWastePaper("Junk Mail Bundle", 
        "Sorted junk mail and advertisements, ready for recycling.", 
        "Mixed Paper", new BigDecimal("15.0"), new BigDecimal("7.50"));

    log.info("Successfully seeded {} waste paper items", repository.count());
  }

  private void createWastePaper(String title, String description, String category, 
                                BigDecimal weightKg, BigDecimal creditValue) {
    WastePaperEntity item = new WastePaperEntity(title, description, category, 
                                                 weightKg, creditValue, defaultOwnerId);
    item.setStatus(WastePaperStatus.AVAILABLE);
    repository.save(item);
  }
}














