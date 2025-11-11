package com.arka.modules.marketplace.repository;

import com.arka.modules.marketplace.entity.BookEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<BookEntity, UUID> {
  boolean existsByTitleIgnoreCaseAndAuthorIgnoreCase(String title, String author);
  Optional<BookEntity> findByTitleIgnoreCaseAndAuthorIgnoreCase(String title, String author);
}

