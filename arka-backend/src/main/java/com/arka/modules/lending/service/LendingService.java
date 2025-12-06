package com.arka.modules.lending.service;

import com.arka.common.result.Result;
import com.arka.modules.lending.dto.CreateLendingRequest;
import com.arka.modules.lending.dto.LendingResponse;
import com.arka.modules.lending.entity.LendingEntity;
import com.arka.modules.lending.entity.LendingStatus;
import com.arka.modules.lending.repository.LendingRepository;
import com.arka.modules.marketplace.entity.BookEntity;
import com.arka.modules.marketplace.entity.BookStatus;
import com.arka.modules.marketplace.repository.BookRepository;
import com.arka.modules.user.entity.UserEntity;
import com.arka.modules.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class LendingService {
  
  private final LendingRepository lendingRepository;
  private final BookRepository bookRepository;
  private final UserRepository userRepository;

  public LendingService(
      LendingRepository lendingRepository,
      BookRepository bookRepository,
      UserRepository userRepository) {
    this.lendingRepository = lendingRepository;
    this.bookRepository = bookRepository;
    this.userRepository = userRepository;
  }

  /**
   * Request to borrow a book
   */
  @Transactional
  public Result<LendingResponse> requestLending(CreateLendingRequest request) {
    // Get book
    BookEntity book = bookRepository.findById(request.bookId())
        .orElse(null);
    if (book == null) {
      return Result.failure("Book not found");
    }

    // Validate book is available for lending
    if (book.getStatus() != BookStatus.PUBLISHED) {
      return Result.failure("Book is not available for lending");
    }

    // Cannot borrow your own book
    if (book.getOwnerId().equals(request.borrowerId())) {
      return Result.failure("Cannot borrow your own book");
    }

    // Check if book is already lent out
    List<LendingEntity> activeLendings = lendingRepository.findByBookIdAndStatusIn(
        request.bookId(),
        List.of(LendingStatus.APPROVED, LendingStatus.ACTIVE));
    if (!activeLendings.isEmpty()) {
      return Result.failure("Book is currently lent out");
    }

    // Get borrower
    UserEntity borrower = userRepository.findById(request.borrowerId())
        .orElse(null);
    if (borrower == null) {
      return Result.failure("Borrower not found");
    }

    // Check if borrower has sufficient credits for deposit
    BigDecimal totalRequired = request.deposit().add(request.lendingFee() != null ? request.lendingFee() : BigDecimal.ZERO);
    if (borrower.getCreditBalance().compareTo(totalRequired) < 0) {
      return Result.failure("Insufficient credits. Required: " + totalRequired + ", Available: " + borrower.getCreditBalance());
    }

    // Reserve deposit
    borrower.deductCredits(totalRequired);
    userRepository.save(borrower);

    // Create lending request
    LendingEntity lending = new LendingEntity(
        book,
        book.getOwnerId(),
        request.borrowerId(),
        request.expectedReturnDate(),
        request.lendingFee() != null ? request.lendingFee() : BigDecimal.ZERO,
        request.deposit() != null ? request.deposit() : BigDecimal.ZERO
    );
    lending.setNotes(request.notes());
    lending.setStatus(LendingStatus.PENDING);
    lending = lendingRepository.save(lending);

    return Result.success(toResponse(lending));
  }

  /**
   * Approve a lending request
   */
  @Transactional
  public Result<LendingResponse> approveLending(UUID lendingId, UUID ownerId) {
    LendingEntity lending = lendingRepository.findById(lendingId)
        .orElse(null);
    if (lending == null) {
      return Result.failure("Lending request not found");
    }

    if (!lending.getOwnerId().equals(ownerId)) {
      return Result.failure("Only the book owner can approve this request");
    }

    if (lending.getStatus() != LendingStatus.PENDING) {
      return Result.failure("Lending request is not pending");
    }

    // Mark book as reserved
    BookEntity book = lending.getBook();
    book.setStatus(BookStatus.RESERVED);
    bookRepository.save(book);

    // Update lending status
    lending.setStatus(LendingStatus.APPROVED);
    lending.setStartDate(Instant.now());
    lending = lendingRepository.save(lending);

    return Result.success(toResponse(lending));
  }

  /**
   * Reject a lending request
   */
  @Transactional
  public Result<LendingResponse> rejectLending(UUID lendingId, UUID ownerId, String reason) {
    LendingEntity lending = lendingRepository.findById(lendingId)
        .orElse(null);
    if (lending == null) {
      return Result.failure("Lending request not found");
    }

    if (!lending.getOwnerId().equals(ownerId)) {
      return Result.failure("Only the book owner can reject this request");
    }

    if (lending.getStatus() != LendingStatus.PENDING) {
      return Result.failure("Lending request is not pending");
    }

    // Refund borrower
    UserEntity borrower = userRepository.findById(lending.getBorrowerId())
        .orElse(null);
    if (borrower != null) {
      BigDecimal refundAmount = lending.getDeposit().add(lending.getLendingFee());
      borrower.addCredits(refundAmount);
      userRepository.save(borrower);
    }

    lending.setStatus(LendingStatus.REJECTED);
    if (reason != null) {
      lending.setNotes((lending.getNotes() != null ? lending.getNotes() + "\n" : "") + "Rejected: " + reason);
    }
    lending = lendingRepository.save(lending);

    return Result.success(toResponse(lending));
  }

  /**
   * Start lending (book is handed over)
   */
  @Transactional
  public Result<LendingResponse> startLending(UUID lendingId, UUID ownerId, String conditionBefore) {
    LendingEntity lending = lendingRepository.findById(lendingId)
        .orElse(null);
    if (lending == null) {
      return Result.failure("Lending request not found");
    }

    if (!lending.getOwnerId().equals(ownerId)) {
      return Result.failure("Only the book owner can start the lending");
    }

    if (lending.getStatus() != LendingStatus.APPROVED) {
      return Result.failure("Lending must be approved first");
    }

    lending.setStatus(LendingStatus.ACTIVE);
    lending.setStartDate(Instant.now());
    lending.setConditionBefore(conditionBefore);
    lending = lendingRepository.save(lending);

    return Result.success(toResponse(lending));
  }

  /**
   * Return a book
   */
  @Transactional
  public Result<LendingResponse> returnBook(UUID lendingId, UUID borrowerId, String conditionAfter) {
    LendingEntity lending = lendingRepository.findById(lendingId)
        .orElse(null);
    if (lending == null) {
      return Result.failure("Lending request not found");
    }

    if (!lending.getBorrowerId().equals(borrowerId)) {
      return Result.failure("Only the borrower can return the book");
    }

    if (lending.getStatus() != LendingStatus.ACTIVE) {
      return Result.failure("Book is not currently lent out");
    }

    // Return deposit to borrower (minus any fees if condition is poor)
    UserEntity borrower = userRepository.findById(borrowerId)
        .orElse(null);
    if (borrower != null) {
      // For now, return full deposit. In production, condition assessment would affect this
      borrower.addCredits(lending.getDeposit());
      userRepository.save(borrower);
    }

    // Pay lending fee to owner
    UserEntity owner = userRepository.findById(lending.getOwnerId())
        .orElse(null);
    if (owner != null && lending.getLendingFee().compareTo(BigDecimal.ZERO) > 0) {
      owner.addCredits(lending.getLendingFee());
      userRepository.save(owner);
    }

    // Update book status
    BookEntity book = lending.getBook();
    book.setStatus(BookStatus.PUBLISHED);
    bookRepository.save(book);

    lending.setStatus(LendingStatus.RETURNED);
    lending.setActualReturnDate(Instant.now());
    lending.setConditionAfter(conditionAfter);
    lending = lendingRepository.save(lending);

    return Result.success(toResponse(lending));
  }

  /**
   * Get user's lending history
   */
  public List<LendingResponse> getUserLendings(UUID userId) {
    return lendingRepository.findByOwnerIdOrBorrowerId(userId, userId)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  /**
   * Get active lendings for a user
   */
  public List<LendingResponse> getActiveLendings(UUID userId) {
    return lendingRepository.findByOwnerIdOrBorrowerId(userId, userId)
        .stream()
        .filter(l -> l.getStatus() == LendingStatus.ACTIVE || l.getStatus() == LendingStatus.APPROVED)
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  private LendingResponse toResponse(LendingEntity lending) {
    // TODO: Fetch user names from user service
    String ownerName = "Owner";
    String borrowerName = "Borrower";

    return new LendingResponse(
        lending.getId(),
        lending.getBook().getId(),
        lending.getBook().getTitle(),
        lending.getBook().getAuthor(),
        lending.getOwnerId(),
        ownerName,
        lending.getBorrowerId(),
        borrowerName,
        lending.getRequestedAt(),
        lending.getStartDate(),
        lending.getExpectedReturnDate(),
        lending.getActualReturnDate(),
        lending.getLendingFee(),
        lending.getDeposit(),
        lending.getStatus().name(),
        lending.getNotes(),
        lending.getConditionBefore(),
        lending.getConditionAfter()
    );
  }
}





