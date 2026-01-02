package com.arka.modules.bookshelf.service;

import com.arka.common.result.Result;
import com.arka.modules.bookshelf.dto.AddToBookshelfRequest;
import com.arka.modules.bookshelf.dto.BookshelfItemResponse;
import com.arka.modules.bookshelf.entity.BookshelfEntity;
import com.arka.modules.bookshelf.repository.BookshelfRepository;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.repository.BookRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookshelfService {
  private final BookshelfRepository bookshelfRepository;
  private final BookRepository bookRepository;

  public BookshelfService(BookshelfRepository bookshelfRepository, BookRepository bookRepository) {
    this.bookshelfRepository = bookshelfRepository;
    this.bookRepository = bookRepository;
  }

  public List<BookshelfItemResponse> getBookshelf(UUID userId) {
    return bookshelfRepository.findByUserId(userId).stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  public Result<BookshelfItemResponse> addToBookshelf(UUID userId, UUID bookId, AddToBookshelfRequest request) {
    if (bookshelfRepository.existsByUserIdAndBookId(userId, bookId)) {
      return Result.failure("Book already in bookshelf");
    }

    BookEntity book = bookRepository.findById(bookId).orElse(null);
    if (book == null) {
      return Result.failure("Book not found");
    }

    BookshelfEntity bookshelfEntity = new BookshelfEntity(userId, bookId);
    if (request != null && request.notes() != null && !request.notes().trim().isEmpty()) {
      bookshelfEntity.setNotes(request.notes().trim());
    }
    bookshelfEntity = bookshelfRepository.save(bookshelfEntity);
    return Result.success(toResponse(bookshelfEntity));
  }

  @Transactional
  public Result<Void> removeFromBookshelf(UUID userId, UUID bookId) {
    return bookshelfRepository.findByUserIdAndBookId(userId, bookId)
        .map(bookshelfEntity -> {
          bookshelfRepository.delete(bookshelfEntity);
          return Result.<Void>success(null);
        })
        .orElse(Result.failure("Book not found in bookshelf"));
  }

  public boolean isInBookshelf(UUID userId, UUID bookId) {
    return bookshelfRepository.existsByUserIdAndBookId(userId, bookId);
  }

  public int getBookshelfCount(UUID userId) {
    return bookshelfRepository.findByUserId(userId).size();
  }

  private BookshelfItemResponse toResponse(BookshelfEntity entity) {
    BookEntity book = bookRepository.findById(entity.getBookId()).orElse(null);
    String bookTitle = book != null ? book.getTitle() : "Unknown Title";
    String bookAuthor = book != null ? book.getAuthor() : "Unknown Author";
    String bookImageUrl = book != null ? book.getImageUrlMedium() : null;
    BigDecimal bookPrice = book != null ? book.getCreditPrice() : BigDecimal.ZERO;

    return new BookshelfItemResponse(
        entity.getId(),
        entity.getUserId(),
        entity.getBookId(),
        bookTitle,
        bookAuthor,
        bookImageUrl,
        bookPrice,
        entity.getNotes(),
        entity.getCreatedAt()
    );
  }
}

