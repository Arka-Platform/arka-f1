package com.arka.modules.user.repository;

import com.arka.modules.user.entity.BehaviorType;
import com.arka.modules.user.entity.UserBehaviorEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserBehaviorRepository extends JpaRepository<UserBehaviorEntity, UUID> {
  
  List<UserBehaviorEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
  
  List<UserBehaviorEntity> findByUserIdAndBehaviorTypeOrderByCreatedAtDesc(
      UUID userId, BehaviorType behaviorType);
  
  List<UserBehaviorEntity> findByUserIdAndBookIdAndBehaviorType(
      UUID userId, UUID bookId, BehaviorType behaviorType);
  
  @Query("SELECT ub.bookId, COUNT(ub) as count FROM UserBehaviorEntity ub " +
         "WHERE ub.userId = :userId AND ub.behaviorType IN :types " +
         "AND ub.bookId IS NOT NULL " +
         "GROUP BY ub.bookId " +
         "ORDER BY count DESC")
  List<Object[]> findTopInteractedBooks(
      @Param("userId") UUID userId, 
      @Param("types") List<BehaviorType> types);
  
  @Query("SELECT ub.category, COUNT(ub) as count FROM UserBehaviorEntity ub " +
         "WHERE ub.userId = :userId AND ub.category IS NOT NULL " +
         "GROUP BY ub.category " +
         "ORDER BY count DESC")
  List<Object[]> findTopCategories(@Param("userId") UUID userId);
  
  @Query("SELECT ub.subcategory, COUNT(ub) as count FROM UserBehaviorEntity ub " +
         "WHERE ub.userId = :userId AND ub.subcategory IS NOT NULL " +
         "GROUP BY ub.subcategory " +
         "ORDER BY count DESC")
  List<Object[]> findTopSubcategories(@Param("userId") UUID userId);
  
  @Query("SELECT ub.bookId, COUNT(ub) as interactionCount " +
         "FROM UserBehaviorEntity ub " +
         "WHERE ub.behaviorType IN :types " +
         "AND ub.bookId IS NOT NULL " +
         "AND ub.createdAt >= :since " +
         "GROUP BY ub.bookId " +
         "ORDER BY interactionCount DESC")
  List<Object[]> findPopularBooks(
      @Param("types") List<BehaviorType> types,
      @Param("since") Instant since);
  
  @Query("SELECT DISTINCT ub2.userId FROM UserBehaviorEntity ub1 " +
         "JOIN UserBehaviorEntity ub2 ON ub1.bookId = ub2.bookId " +
         "WHERE ub1.userId = :userId " +
         "AND ub2.userId != :userId " +
         "AND ub1.behaviorType IN :types " +
         "AND ub2.behaviorType IN :types")
  List<UUID> findSimilarUsers(
      @Param("userId") UUID userId,
      @Param("types") List<BehaviorType> types);
  
  List<UserBehaviorEntity> findByUserId(UUID userId);
  
  List<UserBehaviorEntity> findByBookId(UUID bookId);
  
  @Query("SELECT DISTINCT ub.userId FROM UserBehaviorEntity ub WHERE ub.createdAt >= :since")
  List<UUID> findDistinctUsersSince(@Param("since") Instant since);
}












