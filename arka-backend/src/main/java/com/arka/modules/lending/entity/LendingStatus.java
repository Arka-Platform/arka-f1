package com.arka.modules.lending.entity;

public enum LendingStatus {
  PENDING,        // Request sent, waiting for owner approval
  APPROVED,       // Owner approved, book ready to lend
  ACTIVE,         // Book is currently lent out
  RETURNED,       // Book has been returned
  REJECTED,       // Owner rejected the request
  CANCELLED,      // Borrower or owner cancelled
  OVERDUE         // Book is past due date
}










