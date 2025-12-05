package com.arka.modules.marketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.books-dataset")
public class BooksDatasetProperties {
  private boolean enabled = false;
  private String booksCsvPath = "resources/books_data/books.csv";
  private String ratingsCsvPath = "resources/books_data/ratings.csv";
  private int maxBooks = 5000;
  private int batchSize = 500;
  private int minRatingCount = 5;
  private boolean useRatings = true;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getBooksCsvPath() {
    return booksCsvPath;
  }

  public void setBooksCsvPath(String booksCsvPath) {
    this.booksCsvPath = booksCsvPath;
  }

  public String getRatingsCsvPath() {
    return ratingsCsvPath;
  }

  public void setRatingsCsvPath(String ratingsCsvPath) {
    this.ratingsCsvPath = ratingsCsvPath;
  }

  public int getMaxBooks() {
    return maxBooks;
  }

  public void setMaxBooks(int maxBooks) {
    this.maxBooks = maxBooks;
  }

  public int getBatchSize() {
    return batchSize;
  }

  public void setBatchSize(int batchSize) {
    this.batchSize = batchSize;
  }

  public int getMinRatingCount() {
    return minRatingCount;
  }

  public void setMinRatingCount(int minRatingCount) {
    this.minRatingCount = minRatingCount;
  }

  public boolean isUseRatings() {
    return useRatings;
  }

  public void setUseRatings(boolean useRatings) {
    this.useRatings = useRatings;
  }
}












