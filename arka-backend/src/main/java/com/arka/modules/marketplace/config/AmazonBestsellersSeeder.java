package com.arka.modules.marketplace.config;

import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.amazon-bestsellers", name = "enabled", havingValue = "true")
public class AmazonBestsellersSeeder {
  private static final Logger log = LoggerFactory.getLogger(AmazonBestsellersSeeder.class);
  private static final UUID DEFAULT_OWNER = UUID.fromString("00000000-0000-0000-0000-000000000000");
  private static final Pattern RATING_PATTERN = Pattern.compile("(\\d+\\.?\\d*)\\s+out of 5 stars");
  private static final Pattern PRICE_PATTERN = Pattern.compile("₹?([\\d,]+(?:\\.\\d{2})?)");

  private final BookRepository bookRepository;
  private final ObjectMapper objectMapper;
  private Map<String, String> categoryGenreMap;

  public AmazonBestsellersSeeder(BookRepository bookRepository, ObjectMapper objectMapper) {
    this.bookRepository = bookRepository;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  public void seed() {
    try {
      long existingCount = bookRepository.count();
      if (existingCount > 0) {
        log.info("Books already present ({} books), skipping Amazon bestsellers import", existingCount);
        return;
      }
      
      log.info("No books found in database, starting Amazon bestsellers import...");

      // Load category-genre mapping
      loadCategoryGenreMapping();

      // Load and parse CSV
      ClassPathResource resource = new ClassPathResource("books_data/amazon_bestsellers.csv");
      if (!resource.exists()) {
        log.warn("Amazon bestsellers CSV not found, skipping import");
        return;
      }

      log.info("Importing Amazon bestsellers from CSV...");
      int imported = importBooks(resource);
      if (imported > 0) {
        log.info("Successfully imported {} Amazon bestsellers", imported);
      } else {
        log.warn("Import completed but no books were imported. Check CSV format and data.");
      }
    } catch (Exception e) {
      log.error("Failed to import Amazon bestsellers, continuing without seed data", e);
    }
  }

  private void loadCategoryGenreMapping() {
    try {
      ClassPathResource resource = new ClassPathResource("books_data/category_genre_mapping.json");
      if (resource.exists()) {
        try (InputStream is = resource.getInputStream()) {
          @SuppressWarnings("unchecked")
          Map<String, Object> rawMap = objectMapper.readValue(is, Map.class);
          categoryGenreMap = new HashMap<>();
          for (Map.Entry<String, Object> entry : rawMap.entrySet()) {
            categoryGenreMap.put(entry.getKey(), entry.getValue().toString());
          }
          log.info("Loaded {} category-genre mappings", categoryGenreMap.size());
        }
      } else {
        log.warn("Category-genre mapping file not found, using defaults");
        categoryGenreMap = new HashMap<>();
      }
    } catch (Exception e) {
      log.warn("Failed to load category-genre mapping, using defaults", e);
      categoryGenreMap = new HashMap<>();
    }
  }

  private int importBooks(ClassPathResource resource) throws IOException {
    Set<String> seenTitles = new HashSet<>();
    int imported = 0;
    int skipped = 0;

    try (BufferedReader reader = new BufferedReader(
        new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
      
      // Skip BOM if present
      reader.mark(1);
      int firstChar = reader.read();
      if (firstChar != 0xFEFF) {
        reader.reset();
      }

      CSVFormat format = CSVFormat.DEFAULT.builder()
          .setHeader()
          .setSkipHeaderRecord(true)
          .setIgnoreHeaderCase(true)
          .setTrim(true)
          .build();

      try (CSVParser parser = new CSVParser(reader, format)) {
        for (CSVRecord record : parser) {
          try {
            String title = getValue(record, "data3");
            if (title == null || title.isEmpty()) {
              title = getValue(record, "title");
            }
            
            if (title == null || title.isEmpty()) {
              skipped++;
              continue;
            }

            // Skip duplicates
            String titleKey = title.toLowerCase().trim();
            if (seenTitles.contains(titleKey)) {
              skipped++;
              continue;
            }
            seenTitles.add(titleKey);

            String author = getValue(record, "data5");
            if (author == null || author.isEmpty()) {
              author = "Unknown";
            }

            // Parse price
            BigDecimal price = parsePrice(getValue(record, "price"));
            if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
              price = new BigDecimal("10.00"); // Default price
            }

            // Parse rating
            String ratingStr = getValue(record, "data");
            BigDecimal rating = parseRating(ratingStr);

            // Parse reviews count
            String reviewsStr = getValue(record, "data2");
            Integer reviewsCount = parseReviewsCount(reviewsStr);

            // Determine genre from category links
            String genre = determineGenre(record);
            String category = null;
            String subcategory = null;

            // Extract category and subcategory from links
            String categoryLink1 = getValue(record, "category-link-1");
            if (categoryLink1 != null && !categoryLink1.isEmpty()) {
              String categoryId = extractCategoryId(categoryLink1);
              if (categoryId != null && categoryGenreMap.containsKey(categoryId)) {
                category = categoryGenreMap.get(categoryId);
              }
            }

            String publisher = getValue(record, "data7");
            String bookFormat = getValue(record, "data4");
            String imageUrl = getValue(record, "image");

            // Create book entity
            BookEntity book = new BookEntity(
                title,
                author,
                bookFormat != null ? "Format: " + bookFormat : null,
                genre,
                category,
                subcategory,
                price,
                DEFAULT_OWNER
            );

            if (publisher != null && !publisher.isEmpty()) {
              book.setPublisher(publisher);
            }

            if (rating != null) {
              book.setAverageRating(rating);
            }

            if (reviewsCount != null) {
              book.setRatingsCount(reviewsCount);
            }

            if (imageUrl != null && !imageUrl.isEmpty()) {
              book.setImageUrlSmall(imageUrl);
              book.setImageUrlMedium(imageUrl);
              book.setImageUrlLarge(imageUrl);
            }

            book.setStatus(BookStatus.PUBLISHED);
            try {
              bookRepository.save(book);
              imported++;
              
              if (imported % 100 == 0) {
                log.info("Imported {} books so far...", imported);
              }
            } catch (Exception saveException) {
              log.warn("Failed to save book '{}': {}", title, saveException.getMessage());
              skipped++;
            }
          } catch (Exception e) {
            log.warn("Failed to import book from record: {}", e.getMessage());
            skipped++;
          }
        }
      }
    }

    log.info("Import complete: {} imported, {} skipped", imported, skipped);
    return imported;
  }

  private String getValue(CSVRecord record, String column) {
    try {
      String value = record.get(column);
      return value != null ? value.trim() : null;
    } catch (IllegalArgumentException e) {
      return null;
    }
  }

  private BigDecimal parsePrice(String priceStr) {
    if (priceStr == null || priceStr.isEmpty()) {
      return null;
    }

    try {
      Matcher matcher = PRICE_PATTERN.matcher(priceStr);
      if (matcher.find()) {
        String priceValue = matcher.group(1).replace(",", "");
        // Convert to credits (assuming 1 credit = ₹1, but we'll use a fraction)
        // Amazon prices are in rupees, we'll convert to credits at 1:1 ratio
        BigDecimal price = new BigDecimal(priceValue);
        // Convert to credits (divide by 10 to make it more reasonable for credits)
        return price.divide(new BigDecimal("10"), 2, java.math.RoundingMode.HALF_UP);
      }
    } catch (Exception e) {
      log.debug("Failed to parse price: {}", priceStr);
    }
    return null;
  }

  private BigDecimal parseRating(String ratingStr) {
    if (ratingStr == null || ratingStr.isEmpty()) {
      return null;
    }

    try {
      Matcher matcher = RATING_PATTERN.matcher(ratingStr);
      if (matcher.find()) {
        return new BigDecimal(matcher.group(1));
      }
    } catch (Exception e) {
      log.debug("Failed to parse rating: {}", ratingStr);
    }
    return null;
  }

  private Integer parseReviewsCount(String reviewsStr) {
    if (reviewsStr == null || reviewsStr.isEmpty()) {
      return null;
    }

    try {
      String cleaned = reviewsStr.replace(",", "").trim();
      return Integer.parseInt(cleaned);
    } catch (Exception e) {
      log.debug("Failed to parse reviews count: {}", reviewsStr);
    }
    return null;
  }

  private String determineGenre(CSVRecord record) {
    // Try to get genre from category links
    for (int i = 0; i <= 3; i++) {
      String categoryLink = getValue(record, "category-link-" + i);
      if (categoryLink != null && !categoryLink.isEmpty()) {
        String categoryId = extractCategoryId(categoryLink);
        if (categoryId != null && categoryGenreMap.containsKey(categoryId)) {
          return categoryGenreMap.get(categoryId);
        }
      }
    }
    return "General";
  }

  private String extractCategoryId(String categoryLink) {
    if (categoryLink == null || categoryLink.isEmpty()) {
      return null;
    }

    // Extract category ID from URL like: .../books/1318295031/...
    Pattern pattern = Pattern.compile("/books/(\\d+)/");
    Matcher matcher = pattern.matcher(categoryLink);
    if (matcher.find()) {
      return matcher.group(1);
    }
    return null;
  }
}

