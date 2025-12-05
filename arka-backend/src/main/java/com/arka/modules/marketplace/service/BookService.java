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
  private final ExchangeService exchangeService;

  public BookService(BookRepository bookRepository, BookMapper mapper, ExchangeService exchangeService) {
    this.bookRepository = bookRepository;
    this.mapper = mapper;
    this.exchangeService = exchangeService;
  }

  @Transactional
  public Result<UUID> createBook(CreateBookRequest request) {
    if (bookRepository.existsByTitleIgnoreCaseAndAuthorIgnoreCase(request.title(), request.author())) {
      return Result.failure("Book already exists");
    }
    // TODO: Get ownerId from authenticated user context
    UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000000"); // Placeholder for testing
    BookEntity entity = new BookEntity(request.title(), request.author(), request.description(), 
        request.genre(), null, null, request.price(), ownerId);
    entity.setStatus(BookStatus.PUBLISHED);
    BookEntity saved = bookRepository.save(entity);
    
    // Award listing bonus to encourage book listings
    exchangeService.awardListingBonus(ownerId);
    
    return Result.success(saved.getId());
  }

  public List<BookResponse> listBooks(int page, int size) {
    return bookRepository.findAll()
        .stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .skip((long) page * size)
        .limit(size)
        .map(mapper::toResponse)
        .toList();
  }

  public List<BookResponse> searchBooks(String query) {
    return bookRepository.search(query)
        .stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }

  public List<BookResponse> listBooksByGenre(String genre) {
    return bookRepository.findByGenreIgnoreCase(genre)
        .stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }
}











