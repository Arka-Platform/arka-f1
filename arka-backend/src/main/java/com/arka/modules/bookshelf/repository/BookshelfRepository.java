package com.arka.modules.bookshelf.repository;

import com.arka.modules.bookshelf.entity.BookshelfEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookshelfRepository extends JpaRepository<BookshelfEntity, UUID> {
  List<BookshelfEntity> findByUserId(UUID userId);
  Optional<BookshelfEntity> findByUserIdAndBookId(UUID userId, UUID bookId);
  boolean existsByUserIdAndBookId(UUID userId, UUID bookId);
}


