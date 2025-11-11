package com.arka.modules.marketplace.service;

import com.arka.common.result.Result;
import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.dto.CreateBookRequest;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.mapper.BookMapper;
import com.arka.modules.marketplace.repository.BookRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class BookService {
  private final BookRepository bookRepository;
  private final BookMapper mapper;

  public BookService(BookRepository bookRepository, BookMapper mapper) {
    this.bookRepository = bookRepository;
    this.mapper = mapper;
  }

  @Transactional
  public Result<UUID> createBook(CreateBookRequest request) {
    if (bookRepository.existsByTitleIgnoreCaseAndAuthorIgnoreCase(request.title(), request.author())) {
      return Result.failure("Book already exists");
    }
    BookEntity entity = new BookEntity(request.title(), request.author(), request.description(), request.price());
    entity.setStatus(BookStatus.PUBLISHED);
    BookEntity saved = bookRepository.save(entity);
    return Result.success(saved.getId());
  }

  public List<BookResponse> listBooks(int page, int size) {
    return bookRepository.findAll()
        .stream()
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .skip((long) page * size)
        .limit(size)
        .map(mapper::toResponse)
        .toList();
  }
}

