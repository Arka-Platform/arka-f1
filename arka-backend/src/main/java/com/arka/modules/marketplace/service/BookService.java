package com.arka.modules.marketplace.service;

import com.arka.common.result.Result;
import com.arka.modules.marketplace.dto.BookResponse;
import com.arka.modules.marketplace.dto.CreateBookRequest;
import com.arka.modules.marketplace.dto.GenreWithSubcategories;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.mapper.BookMapper;
import com.arka.modules.marketplace.repository.BookRepository;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
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
  public Result<UUID> createBook(CreateBookRequest request, UUID ownerId) {
    if (bookRepository.existsByTitleIgnoreCaseAndAuthorIgnoreCase(request.title(), request.author())) {
      return Result.failure("Book already exists");
    }
    BookEntity entity = new BookEntity(request.title(), request.author(), request.description(), 
        request.genre(), null, null, request.price(), ownerId);
    entity.setStatus(BookStatus.PUBLISHED);
    if (request.imageUrl() != null && !request.imageUrl().trim().isEmpty()) {
      entity.setImageUrlMedium(request.imageUrl().trim());
      entity.setImageUrlSmall(request.imageUrl().trim());
    }
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
    return bookRepository.findByGenreContainingIgnoreCase(genre)
        .stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }

  public List<BookResponse> listBooksByGenreAndSubcategory(String genre, String subcategory) {
    return bookRepository.findByGenreAndSubcategoryContainingIgnoreCase(genre, subcategory)
        .stream()
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }

  public List<BookResponse> getBooksByOwner(UUID ownerId) {
    return bookRepository.findByOwnerId(ownerId)
        .stream()
        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
        .map(mapper::toResponse)
        .toList();
  }

  public java.util.Optional<BookResponse> getBookById(UUID id) {
    return bookRepository.findById(id)
        .filter(book -> book.getStatus() == BookStatus.PUBLISHED)
        .map(mapper::toResponse);
  }

  @Transactional
  public Result<BookResponse> updateBook(UUID id, CreateBookRequest request) {
    return bookRepository.findById(id)
        .map(entity -> {
          entity.setTitle(request.title());
          entity.setAuthor(request.author());
          entity.setDescription(request.description());
          entity.setGenre(request.genre());
          entity.setCreditPrice(request.price());
          if (request.imageUrl() != null && !request.imageUrl().trim().isEmpty()) {
            entity.setImageUrlMedium(request.imageUrl().trim());
            entity.setImageUrlSmall(request.imageUrl().trim());
          }
          BookEntity saved = bookRepository.save(entity);
          return Result.success(mapper.toResponse(saved));
        })
        .orElse(Result.failure("Book not found"));
  }

  @Transactional
  public Result<Void> deleteBook(UUID id) {
    return bookRepository.findById(id)
        .map(entity -> {
          entity.setStatus(BookStatus.DRAFT); // Mark as draft instead of deleting
          bookRepository.save(entity);
          return Result.<Void>success(null);
        })
        .orElse(Result.failure("Book not found"));
  }

  @Transactional
  public Result<BookResponse> updateBookStatus(UUID id, String status) {
    try {
      BookStatus newStatus = BookStatus.valueOf(status.toUpperCase());
      return bookRepository.findById(id)
          .map(entity -> {
            entity.setStatus(newStatus);
            BookEntity saved = bookRepository.save(entity);
            return Result.success(mapper.toResponse(saved));
          })
          .orElse(Result.failure("Book not found"));
    } catch (IllegalArgumentException e) {
      return Result.failure("Invalid status: " + status);
    }
  }

  public List<String> getAllGenres() {
    return bookRepository.findDistinctGenres();
  }

  public List<GenreWithSubcategories> getGenresWithSubcategories() {
    List<String> genres = bookRepository.findDistinctGenres();
    List<GenreWithSubcategories> result = new ArrayList<>();
    
    for (String genre : genres) {
      List<String> subcategories = bookRepository.findDistinctSubcategoriesByGenre(genre);
      result.add(new GenreWithSubcategories(genre, subcategories));
    }
    
    return result;
  }
}











