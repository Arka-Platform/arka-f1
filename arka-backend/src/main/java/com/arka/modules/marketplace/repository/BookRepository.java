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
  
  List<BookEntity> findByGenreIgnoreCase(String genre);
  
  long countByStatus(com.arka.modules.marketplace.entity.BookStatus status);
}











