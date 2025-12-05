package com.arka.modules.marketplace.config;

import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.books-dataset", name = "enabled", havingValue = "true")
public class BooksDatasetSeeder {
  private static final Logger log = LoggerFactory.getLogger(BooksDatasetSeeder.class);
  private static final UUID DEFAULT_OWNER =
      UUID.fromString("00000000-0000-0000-0000-000000000000");
  private static final int CURRENT_YEAR = Year.now().getValue();
  private static final Charset DATASET_CHARSET = StandardCharsets.ISO_8859_1;
  private static final List<GenreRule> GENRE_RULES = List.of(
      new GenreRule("science fiction", "Science Fiction"),
      new GenreRule("sci-fi", "Science Fiction"),
      new GenreRule("fantasy", "Fantasy"),
      new GenreRule("thriller", "Thriller"),
      new GenreRule("mystery", "Mystery"),
      new GenreRule("detective", "Mystery"),
      new GenreRule("romance", "Romance"),
      new GenreRule("love", "Romance"),
      new GenreRule("history", "Historical Fiction"),
      new GenreRule("historical", "Historical Fiction"),
      new GenreRule("biography", "Biography"),
      new GenreRule("memoir", "Biography"),
      new GenreRule("horror", "Horror"),
      new GenreRule("poetry", "Poetry"),
      new GenreRule("business", "Business"),
      new GenreRule("self-help", "Self-Help"),
      new GenreRule("science", "Science"),
      new GenreRule("technology", "Technology"),
      new GenreRule("cook", "Cooking"),
      new GenreRule("art", "Art & Design")
  );

  private final BookRepository bookRepository;
  private final BooksDatasetProperties properties;

  public BooksDatasetSeeder(BookRepository bookRepository, BooksDatasetProperties properties) {
    this.bookRepository = bookRepository;
    this.properties = properties;
  }

  @PostConstruct
  public void seed() {
    try {
      if (bookRepository.count() > 0) {
        log.info("Books already present, skipping dataset import");
        return;
      }

      Path booksPath = resolvePath(properties.getBooksCsvPath());
      if (!Files.exists(booksPath)) {
        log.warn("Books dataset not found at {}, skipping import", booksPath);
        return;
      }

      Map<String, RatingAggregate> ratingStats = Map.of();
      if (properties.isUseRatings()) {
        Path ratingsPath = resolvePath(properties.getRatingsCsvPath());
        if (Files.exists(ratingsPath)) {
          ratingStats = loadRatingStats(ratingsPath);
        } else {
          log.warn("Ratings dataset not found at {}, continuing without ratings", ratingsPath);
        }
      }

      log.info("Importing books dataset from {}", booksPath);
      importBooks(booksPath, ratingStats);
    } catch (Exception e) {
      // Don't fail application startup if seeding fails
      log.error("Failed to import books dataset, continuing without seed data", e);
    }
  }

  private void importBooks(Path booksPath, Map<String, RatingAggregate> ratingStats) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(booksPath, DATASET_CHARSET)) {
      String headerLine = reader.readLine();
      if (headerLine == null) {
        log.warn("Books dataset file {} is empty", booksPath);
        return;
      }

      String[] headers = parseHeader(headerLine);
      CSVFormat rowFormat = CSVFormat.DEFAULT.builder()
          .setDelimiter(';')
          .setQuote('"')
          .setHeader(headers)
          .setSkipHeaderRecord(false)
          .build();

      List<BookEntity> batch = new ArrayList<>(properties.getBatchSize());
      Set<String> seenIsbns = new HashSet<>();
      int imported = 0;
      long lineNumber = 1;
      String line;

      while ((line = reader.readLine()) != null) {
        lineNumber++;
        if (imported >= properties.getMaxBooks()) {
          break;
        }

        CSVRecord record = parseLine(line, lineNumber, rowFormat);
        if (record == null) {
          continue;
        }

        Optional<BookEntity> maybeEntity = toBook(record, ratingStats);
        if (maybeEntity.isEmpty()) {
          continue;
        }

        BookEntity entity = maybeEntity.get();
        if (entity.getIsbn() != null && !seenIsbns.add(entity.getIsbn())) {
          continue;
        }

        entity.setStatus(BookStatus.PUBLISHED);
        batch.add(entity);
        imported++;

        if (batch.size() >= properties.getBatchSize()) {
          bookRepository.saveAll(batch);
          batch.clear();
          log.info("Imported {} books so far...", imported);
        }
      }

      if (!batch.isEmpty()) {
        bookRepository.saveAll(batch);
      }

      log.info("Imported {} books from dataset", imported);
    }
  }

  private Optional<BookEntity> toBook(CSVRecord record, Map<String, RatingAggregate> ratingStats) {
    String isbn = normalize(record.get("ISBN"));
    String title = normalize(record.get("Book-Title"));
    String author = normalize(record.get("Book-Author"));
    String publisher = normalize(record.get("Publisher"));
    String yearValue = normalize(record.get("Year-Of-Publication"));
    Integer year = parseYear(yearValue);
    if (title == null || author == null || title.isBlank() || author.isBlank()) {
      return Optional.empty();
    }

    RatingAggregate ratingAggregate = ratingStats.getOrDefault(isbn, null);
    if (ratingAggregate != null && ratingAggregate.count < properties.getMinRatingCount()) {
      ratingAggregate = null;
    }

    String genre = classifyGenre(title, publisher);
    String description = generateDescription(title, author, publisher, year, ratingAggregate);
    BigDecimal price = determinePrice(year, ratingAggregate);

    BookEntity entity = new BookEntity(title, author, description, genre, genre, publisher, price, DEFAULT_OWNER);
    entity.setIsbn(isbn);
    entity.setPublisher(publisher);
    entity.setPublicationYear(year);
    entity.setCategory(genre);
    entity.setSubcategory(genre);
    entity.setImageUrlSmall(normalize(record.get("Image-URL-S")));
    entity.setImageUrlMedium(normalize(record.get("Image-URL-M")));
    entity.setImageUrlLarge(normalize(record.get("Image-URL-L")));

    if (ratingAggregate != null && ratingAggregate.count > 0) {
      BigDecimal avg = BigDecimal.valueOf(ratingAggregate.average()).setScale(2, RoundingMode.HALF_UP);
      entity.setAverageRating(avg);
      entity.setRatingsCount((int) ratingAggregate.count);
    } else {
      entity.setRatingsCount(0);
    }

    return Optional.of(entity);
  }

  private Map<String, RatingAggregate> loadRatingStats(Path ratingsPath) {
    log.info("Aggregating rating data from {}", ratingsPath);
    Map<String, RatingAggregate> stats = new HashMap<>();
    try (Reader reader = Files.newBufferedReader(ratingsPath, DATASET_CHARSET);
         CSVParser parser = CSVFormat.DEFAULT.builder()
             .setDelimiter(';')
             .setHeader()
             .setSkipHeaderRecord(true)
             .build()
             .parse(reader)) {
      for (CSVRecord record : parser) {
        String isbn = normalize(record.get("ISBN"));
        String ratingValue = normalize(record.get("Book-Rating"));
        if (isbn == null || ratingValue == null) {
          continue;
        }
        int rating;
        try {
          rating = Integer.parseInt(ratingValue);
        } catch (NumberFormatException e) {
          continue;
        }
        if (rating <= 0) {
          continue; // Skip implicit ratings
        }
        stats.computeIfAbsent(isbn, key -> new RatingAggregate()).add(rating);
      }
    } catch (UncheckedIOException e) {
      log.warn("Ratings dataset contained malformed row ({}). Skipping ratings aggregation.", e.getMessage());
      return Map.of();
    } catch (IOException e) {
      log.error("Failed to read ratings dataset", e);
      return Map.of();
    }
    log.info("Aggregated ratings for {} ISBNs", stats.size());
    return stats;
  }

  private String[] parseHeader(String headerLine) throws IOException {
    try (CSVParser headerParser = CSVParser.parse(
        headerLine,
        CSVFormat.DEFAULT.builder().setDelimiter(';').setQuote('"').build())) {
      CSVRecord headerRecord = headerParser.iterator().next();
      String[] headers = new String[headerRecord.size()];
      for (int i = 0; i < headerRecord.size(); i++) {
        headers[i] = headerRecord.get(i);
      }
      return headers;
    }
  }

  private CSVRecord parseLine(String line, long lineNumber, CSVFormat format) {
    try (CSVParser parser = CSVParser.parse(line, format)) {
      var iterator = parser.iterator();
      if (iterator.hasNext()) {
        return iterator.next();
      }
      return null;
    } catch (IOException | IllegalArgumentException | UncheckedIOException e) {
      log.warn("Skipping malformed books row {}: {}", lineNumber, e.getMessage());
      return null;
    }
  }

  private static BigDecimal determinePrice(Integer year, RatingAggregate ratingAggregate) {
    double base = 8.0;
    if (ratingAggregate != null && ratingAggregate.count > 0) {
      base += ratingAggregate.average() / 2.0;
    }
    if (year != null && year > 0 && year <= CURRENT_YEAR) {
      int age = Math.max(0, CURRENT_YEAR - year);
      base += Math.max(1.0, 6.0 - (age / 25.0));
    }
    double clamped = Math.max(5.0, Math.min(60.0, base));
    return BigDecimal.valueOf(clamped).setScale(2, RoundingMode.HALF_UP);
  }

  private static String classifyGenre(String title, String publisher) {
    String corpus = (title + " " + (publisher == null ? "" : publisher)).toLowerCase(Locale.ROOT);
    for (GenreRule rule : GENRE_RULES) {
      if (corpus.contains(rule.keyword())) {
        return rule.genre();
      }
    }
    return "General";
  }

  private static String generateDescription(String title, String author, String publisher, Integer year,
      RatingAggregate ratingAggregate) {
    StringBuilder builder = new StringBuilder();
    builder.append(title).append(" by ").append(author).append(". ");
    if (publisher != null) {
      builder.append("Published by ").append(publisher);
      if (year != null && year > 0) {
        builder.append(" in ").append(year);
      }
      builder.append(". ");
    }
    if (ratingAggregate != null && ratingAggregate.count > 0) {
      builder.append("Loved by ").append(ratingAggregate.count).append(" readers with an average score of ")
          .append(String.format(Locale.ROOT, "%.1f", ratingAggregate.average())).append("/10. ");
    } else {
      builder.append("Part of the community-powered Arka circulation network. ");
    }
    builder.append("Ships in eco-friendly packaging with Arka credits.");
    return builder.toString();
  }

  private static Integer parseYear(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      int parsed = Integer.parseInt(raw);
      if (parsed <= 0 || parsed > CURRENT_YEAR) {
        return null;
      }
      return parsed;
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private static String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
      return null;
    }
    return trimmed.replace("&amp;", "&");
  }

  private static Path resolvePath(String rawPath) {
    if (rawPath == null || rawPath.isBlank()) {
      return Paths.get("");
    }
    Path path = Paths.get(rawPath);
    if (path.isAbsolute()) {
      return path;
    }
    return Paths.get(System.getProperty("user.dir")).resolve(rawPath).normalize();
  }

  private static final class RatingAggregate {
    private long count = 0;
    private double sum = 0;

    void add(int rating) {
      count++;
      sum += rating;
    }

    double average() {
      return count == 0 ? 0 : sum / count;
    }
  }

  private record GenreRule(String keyword, String genre) {}
}

