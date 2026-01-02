package com.arka.modules.marketplace.repository;

import com.arka.modules.marketplace.entity.BookEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<BookEntity, UUID> {
  boolean existsByTitleIgnoreCaseAndAuthorIgnoreCase(String title, String author);
  Optional<BookEntity> findByTitleIgnoreCaseAndAuthorIgnoreCase(String title, String author);
  
  @Query("SELECT b FROM BookEntity b WHERE " +
         "LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(b.genre) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(b.publisher) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(b.isbn) LIKE LOWER(CONCAT('%', :query, '%'))")
  List<BookEntity> search(@Param("query") String query);
  
  @Query("SELECT b FROM BookEntity b WHERE LOWER(b.genre) LIKE LOWER(CONCAT('%', :genre, '%'))")
  List<BookEntity> findByGenreContainingIgnoreCase(@Param("genre") String genre);
  
  // Keep the old method for backward compatibility but use the new one in service
  @Deprecated
  List<BookEntity> findByGenreIgnoreCase(String genre);
  
  List<BookEntity> findByOwnerId(UUID ownerId);
  
  long countByStatus(com.arka.modules.marketplace.entity.BookStatus status);
  
  @Query("SELECT DISTINCT b.genre FROM BookEntity b WHERE b.genre IS NOT NULL AND b.genre != '' AND b.status = 'PUBLISHED' ORDER BY b.genre")
  List<String> findDistinctGenres();
  
  @Query("SELECT DISTINCT b.subcategory FROM BookEntity b WHERE b.genre = :genre AND b.subcategory IS NOT NULL AND b.subcategory != '' AND b.status = 'PUBLISHED' ORDER BY b.subcategory")
  List<String> findDistinctSubcategoriesByGenre(@Param("genre") String genre);
  
  @Query("SELECT b FROM BookEntity b WHERE LOWER(b.genre) LIKE LOWER(CONCAT('%', :genre, '%')) AND LOWER(b.subcategory) LIKE LOWER(CONCAT('%', :subcategory, '%')) AND b.status = 'PUBLISHED'")
  List<BookEntity> findByGenreAndSubcategoryContainingIgnoreCase(@Param("genre") String genre, @Param("subcategory") String subcategory);
}











