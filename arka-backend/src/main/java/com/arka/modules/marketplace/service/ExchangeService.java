package com.arka.modules.marketplace.service;

import com.arka.common.result.Result;
import com.arka.modules.bookshelf.dto.AddToBookshelfRequest;
import com.arka.modules.bookshelf.service.BookshelfService;
import com.arka.modules.marketplace.dto.ExchangeResponse;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.entity.CreditTransactionDirection;
import com.arka.modules.marketplace.entity.CreditTransactionEntity;
import com.arka.modules.marketplace.entity.CreditTransactionType;
import com.arka.modules.marketplace.entity.ExchangeEntity;
import com.arka.modules.marketplace.entity.ExchangeStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.marketplace.repository.CreditTransactionRepository;
import com.arka.modules.marketplace.repository.ExchangeRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Service for managing book exchanges with monetization features.
 * 
 * Business Model:
 * - Service Fee: 10% of book price (configurable)
 * - Minimum Service Fee: 1 credit
 * - Credits are earned when listing books and selling them
 * - Credits are spent when buying books
 */
@Service
public class ExchangeService {
  private static final BigDecimal SERVICE_FEE_PERCENTAGE = new BigDecimal("0.10"); // 10%
  private static final BigDecimal MIN_SERVICE_FEE = new BigDecimal("1.00");
  private static final BigDecimal LISTING_BONUS = new BigDecimal("5.00"); // Credits for listing a book

  private final ExchangeRepository exchangeRepository;
  private final BookRepository bookRepository;
  private final UserRepository userRepository;
  private final CreditTransactionRepository creditTransactionRepository;
  private final com.arka.modules.trustscore.service.TrustScoreService trustScoreService;
  private final BookshelfService bookshelfService;

  public ExchangeService(
      ExchangeRepository exchangeRepository,
      BookRepository bookRepository,
      UserRepository userRepository,
      CreditTransactionRepository creditTransactionRepository,
      com.arka.modules.trustscore.service.TrustScoreService trustScoreService,
      BookshelfService bookshelfService) {
    this.exchangeRepository = exchangeRepository;
    this.bookRepository = bookRepository;
    this.userRepository = userRepository;
    this.creditTransactionRepository = creditTransactionRepository;
    this.trustScoreService = trustScoreService;
    this.bookshelfService = bookshelfService;
  }

  /**
   * Calculate service fee for an exchange
   * Fee = max(10% of book price, 1 credit)
   */
  public BigDecimal calculateServiceFee(BigDecimal bookPrice) {
    BigDecimal fee = bookPrice.multiply(SERVICE_FEE_PERCENTAGE)
        .setScale(2, RoundingMode.HALF_UP);
    return fee.compareTo(MIN_SERVICE_FEE) < 0 ? MIN_SERVICE_FEE : fee;
  }

  /**
   * Create a new book exchange
   * 
   * Business Logic:
   * 1. Reserve the book (status = RESERVED)
   * 2. Calculate total cost (book price + service fee)
   * 3. Check buyer has sufficient credits
   * 4. Deduct credits from buyer
   * 5. Create exchange record
   * 6. Record credit transactions
   */
  @Transactional
  public Result<ExchangeResponse> createExchange(UUID bookId, UUID buyerId) {
    // Get book
    BookEntity book = bookRepository.findById(bookId)
        .orElse(null);
    if (book == null) {
      return Result.failure("Book not found");
    }

    // Validate book is available
    if (book.getStatus() != BookStatus.PUBLISHED) {
      return Result.failure("Book is not available for exchange");
    }

    // Cannot buy your own book
    if (book.getOwnerId().equals(buyerId)) {
      return Result.failure("Cannot exchange your own book");
    }

    // Get buyer
    UserEntity buyer = userRepository.findById(buyerId)
        .orElse(null);
    if (buyer == null) {
      return Result.failure("Buyer not found");
    }

    // Calculate costs
    BigDecimal bookPrice = book.getCreditPrice();
    BigDecimal serviceFee = calculateServiceFee(bookPrice);
    BigDecimal totalCost = bookPrice.add(serviceFee);

    // Check buyer has sufficient credits
    if (buyer.getCreditBalance().compareTo(totalCost) < 0) {
      return Result.failure("Insufficient credits. Required: " + totalCost + ", Available: " + buyer.getCreditBalance());
    }

    // Reserve the book
    book.setStatus(BookStatus.RESERVED);
    bookRepository.save(book);

    // Deduct credits from buyer
    buyer.deductCredits(totalCost);
    userRepository.save(buyer);

    // Create exchange
    ExchangeEntity exchange = new ExchangeEntity(
        book,
        book.getOwnerId(),
        buyerId,
        bookPrice,
        serviceFee
    );
    exchange.setStatus(ExchangeStatus.PENDING);
    exchange = exchangeRepository.save(exchange);

    // Record credit transactions
    // Buyer: Debit for book purchase
    CreditTransactionEntity buyerBookDebit = new CreditTransactionEntity(
        buyerId,
        exchange.getId(),
        bookPrice,
        CreditTransactionType.BOOK_EXCHANGE,
        CreditTransactionDirection.DEBIT,
        "Purchased book: " + book.getTitle()
    );
    creditTransactionRepository.save(buyerBookDebit);

    // Buyer: Debit for service fee
    CreditTransactionEntity buyerFeeDebit = new CreditTransactionEntity(
        buyerId,
        exchange.getId(),
        serviceFee,
        CreditTransactionType.SERVICE_FEE,
        CreditTransactionDirection.DEBIT,
        "Service fee for exchange: " + book.getTitle()
    );
    creditTransactionRepository.save(buyerFeeDebit);

    return Result.success(toResponse(exchange, book));
  }

  /**
   * Confirm an exchange (seller confirms receipt)
   * Transfers credits to seller and marks exchange as completed
   */
  @Transactional
  public Result<ExchangeResponse> confirmExchange(UUID exchangeId, UUID sellerId) {
    ExchangeEntity exchange = exchangeRepository.findById(exchangeId)
        .orElse(null);
    if (exchange == null) {
      return Result.failure("Exchange not found");
    }

    if (!exchange.getSellerId().equals(sellerId)) {
      return Result.failure("Only the seller can confirm this exchange");
    }

    if (exchange.getStatus() != ExchangeStatus.PENDING) {
      return Result.failure("Exchange is not in pending status");
    }

    // Get seller
    UserEntity seller = userRepository.findById(sellerId)
        .orElse(null);
    if (seller == null) {
      return Result.failure("Seller not found");
    }

    // Transfer credits to seller (book price only, service fee is platform revenue)
    seller.addCredits(exchange.getCreditAmount());
    userRepository.save(seller);

    // Record credit transaction for seller
    CreditTransactionEntity sellerCredit = new CreditTransactionEntity(
        sellerId,
        exchange.getId(),
        exchange.getCreditAmount(),
        CreditTransactionType.BOOK_EXCHANGE,
        CreditTransactionDirection.CREDIT,
        "Sold book: " + exchange.getBook().getTitle()
    );
    creditTransactionRepository.save(sellerCredit);

    // Update exchange status
    exchange.setStatus(ExchangeStatus.CONFIRMED);
    exchange = exchangeRepository.save(exchange);

    // Mark book as exchanged
    BookEntity book = exchange.getBook();
    book.setStatus(BookStatus.EXCHANGED);
    bookRepository.save(book);

    return Result.success(toResponse(exchange, book));
  }

  /**
   * Complete an exchange (buyer confirms receipt)
   */
  @Transactional
  public Result<ExchangeResponse> completeExchange(UUID exchangeId, UUID buyerId) {
    ExchangeEntity exchange = exchangeRepository.findById(exchangeId)
        .orElse(null);
    if (exchange == null) {
      return Result.failure("Exchange not found");
    }

    if (!exchange.getBuyerId().equals(buyerId)) {
      return Result.failure("Only the buyer can complete this exchange");
    }

    if (exchange.getStatus() != ExchangeStatus.CONFIRMED) {
      return Result.failure("Exchange must be confirmed by seller first");
    }

    exchange.setStatus(ExchangeStatus.COMPLETED);
    exchange = exchangeRepository.save(exchange);

    // Track trust score: transaction completion
    trustScoreService.recordTransactionCompletion(exchange.getSellerId());
    trustScoreService.recordTransactionCompletion(exchange.getBuyerId());

    // Track condition accuracy if both conditions are provided
    if (exchange.getListedCondition() != null && exchange.getReceivedCondition() != null) {
      trustScoreService.recordConditionAssessment(
          exchange.getSellerId(),
          exchange.getListedCondition(),
          exchange.getReceivedCondition()
      );
    }

    // Automatically add book to buyer's bookshelf
    try {
      bookshelfService.addToBookshelf(exchange.getBuyerId(), exchange.getBook().getId(), new AddToBookshelfRequest(null));
    } catch (Exception e) {
      // Silently fail if book is already in bookshelf or other error
      // This prevents exchange completion from failing due to bookshelf issues
    }

    return Result.success(toResponse(exchange, exchange.getBook()));
  }

  /**
   * Cancel an exchange and refund buyer
   */
  @Transactional
  public Result<ExchangeResponse> cancelExchange(UUID exchangeId, UUID userId) {
    ExchangeEntity exchange = exchangeRepository.findById(exchangeId)
        .orElse(null);
    if (exchange == null) {
      return Result.failure("Exchange not found");
    }

    if (!exchange.getBuyerId().equals(userId) && !exchange.getSellerId().equals(userId)) {
      return Result.failure("Only buyer or seller can cancel this exchange");
    }

    if (exchange.getStatus() == ExchangeStatus.COMPLETED) {
      return Result.failure("Cannot cancel a completed exchange");
    }

    // Refund buyer
    UserEntity buyer = userRepository.findById(exchange.getBuyerId())
        .orElse(null);
    if (buyer != null) {
      BigDecimal refundAmount = exchange.getCreditAmount().add(exchange.getServiceFee());
      buyer.addCredits(refundAmount);
      userRepository.save(buyer);

      // Record refund transaction
      CreditTransactionEntity refund = new CreditTransactionEntity(
          exchange.getBuyerId(),
          exchange.getId(),
          refundAmount,
          CreditTransactionType.REFUND,
          CreditTransactionDirection.CREDIT,
          "Refund for cancelled exchange: " + exchange.getBook().getTitle()
      );
      creditTransactionRepository.save(refund);
    }

    // Release book
    BookEntity book = exchange.getBook();
    book.setStatus(BookStatus.PUBLISHED);
    bookRepository.save(book);

    exchange.setStatus(ExchangeStatus.CANCELLED);
    exchange = exchangeRepository.save(exchange);

    // Track trust score: transaction cancellation
    trustScoreService.recordTransactionCancellation(exchange.getSellerId());
    trustScoreService.recordTransactionCancellation(exchange.getBuyerId());

    return Result.success(toResponse(exchange, book));
  }

  /**
   * Award listing bonus when a book is first published
   */
  @Transactional
  public void awardListingBonus(UUID userId) {
    UserEntity user = userRepository.findById(userId).orElse(null);
    if (user != null) {
      user.addCredits(LISTING_BONUS);
      userRepository.save(user);

      CreditTransactionEntity bonus = new CreditTransactionEntity(
          userId,
          null,
          LISTING_BONUS,
          CreditTransactionType.BOOK_LISTING,
          CreditTransactionDirection.CREDIT,
          "Listing bonus for publishing a book"
      );
      creditTransactionRepository.save(bonus);
    }
  }

  public List<ExchangeResponse> getUserExchanges(UUID userId) {
    return exchangeRepository.findByBuyerIdOrSellerId(userId, userId)
        .stream()
        .map(exchange -> toResponse(exchange, exchange.getBook()))
        .collect(Collectors.toList());
  }

  public List<ExchangeResponse> getBookExchanges(UUID bookId) {
    return exchangeRepository.findByBookId(bookId)
        .stream()
        .map(exchange -> toResponse(exchange, exchange.getBook()))
        .collect(Collectors.toList());
  }

  private ExchangeResponse toResponse(ExchangeEntity exchange, BookEntity book) {
    // Get user names (simplified - in production, fetch from user service)
    String sellerName = "Seller"; // TODO: Fetch from user service
    String buyerName = "Buyer"; // TODO: Fetch from user service

    return new ExchangeResponse(
        exchange.getId(),
        book.getId(),
        book.getTitle(),
        book.getAuthor(),
        exchange.getSellerId(),
        sellerName,
        exchange.getBuyerId(),
        buyerName,
        exchange.getCreditAmount(),
        exchange.getServiceFee(),
        exchange.getStatus().name(),
        exchange.getCreatedAt(),
        exchange.getCreatedAt() // TODO: Add updatedAt to BaseEntity if needed
    );
  }
}

