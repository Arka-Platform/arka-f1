package com.arka.modules.demand.repository;

import com.arka.modules.demand.entity.BookRequestEntity;
import com.arka.modules.demand.entity.BookRequestStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRequestRepository extends JpaRepository<BookRequestEntity, UUID> {
  List<BookRequestEntity> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);
  
  List<BookRequestEntity> findByStatusOrderByCreatedAtDesc(BookRequestStatus status);
  
  List<BookRequestEntity> findByStatusAndExpiresAtAfterOrderByCreatedAtDesc(
      BookRequestStatus status, Instant expiresAt);
  
  @Query("SELECT br FROM BookRequestEntity br WHERE " +
         "LOWER(br.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(br.author) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(br.genre) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(br.isbn) LIKE LOWER(CONCAT('%', :query, '%'))")
  List<BookRequestEntity> search(@Param("query") String query);
  
  @Query("SELECT br FROM BookRequestEntity br WHERE br.genre = :genre AND br.status = 'OPEN'")
  List<BookRequestEntity> findByGenreAndOpen(@Param("genre") String genre);
  
  @Query("SELECT br FROM BookRequestEntity br WHERE br.status = 'OPEN' AND (br.expiresAt IS NULL OR br.expiresAt > :now)")
  List<BookRequestEntity> findOpenRequests(@Param("now") Instant now);
  
  List<BookRequestEntity> findByFulfilledByOrderByFulfilledAtDesc(UUID fulfilledBy);
  
  @Query("SELECT br FROM BookRequestEntity br WHERE br.status IN ('FULFILLED', 'COMPLETED') ORDER BY br.fulfilledAt DESC")
  List<BookRequestEntity> findRecentlyServedRequests();
  
  @Query("SELECT br FROM BookRequestEntity br WHERE br.status IN ('FULFILLED', 'COMPLETED') AND br.fulfilledAt >= :since ORDER BY br.fulfilledAt DESC")
  List<BookRequestEntity> findRecentlyServedRequestsSince(@Param("since") Instant since);
  
  @Query("SELECT COUNT(br) FROM BookRequestEntity br WHERE br.status = 'OPEN'")
  Long countOpenRequests();
  
  @Query("SELECT COUNT(br) FROM BookRequestEntity br WHERE br.status IN ('FULFILLED', 'COMPLETED') AND br.fulfilledAt >= :since")
  Long countCompletedRequestsSince(@Param("since") Instant since);
  
  @Query("SELECT COUNT(br) FROM BookRequestEntity br WHERE br.createdAt >= :since")
  Long countRequestsCreatedSince(@Param("since") Instant since);
  
  /**
   * Find the most requested book (by title and author combination)
   * Returns the book title, author, and request count
   */
  @Query("SELECT br.title, br.author, COUNT(br) as requestCount " +
         "FROM BookRequestEntity br " +
         "WHERE br.status = 'OPEN' " +
         "GROUP BY br.title, br.author " +
         "ORDER BY requestCount DESC")
  List<Object[]> findMostRequestedBooks(org.springframework.data.domain.Pageable pageable);
}

