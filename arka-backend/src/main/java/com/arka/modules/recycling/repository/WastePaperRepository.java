package com.arka.modules.recycling.repository;

import com.arka.modules.recycling.entity.WastePaperEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WastePaperRepository extends JpaRepository<WastePaperEntity, UUID> {
  
  @Query("SELECT w FROM WastePaperEntity w WHERE " +
         "LOWER(w.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(w.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(w.category) LIKE LOWER(CONCAT('%', :query, '%'))")
  List<WastePaperEntity> search(@Param("query") String query);
  
  List<WastePaperEntity> findByCategoryIgnoreCase(String category);
}
















