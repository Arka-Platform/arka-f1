package com.arka.modules.user.service;

import com.arka.modules.user.entity.BehaviorType;
import com.arka.modules.user.entity.UserBehaviorEntity;
import com.arka.modules.user.repository.UserBehaviorRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserBehaviorService {
  private final UserBehaviorRepository repository;

  public UserBehaviorService(UserBehaviorRepository repository) {
    this.repository = repository;
  }

  @Transactional
  public void trackBookView(UUID userId, UUID bookId, Integer durationSeconds) {
    UserBehaviorEntity behavior = new UserBehaviorEntity(userId, bookId, BehaviorType.BOOK_VIEW);
    behavior.setDurationSeconds(durationSeconds);
    repository.save(behavior);
  }

  @Transactional
  public void trackSearch(UUID userId, String query, String category, String subcategory) {
    UserBehaviorEntity behavior = new UserBehaviorEntity(userId, BehaviorType.BOOK_SEARCH);
    behavior.setSearchQuery(query);
    behavior.setCategory(category);
    behavior.setSubcategory(subcategory);
    repository.save(behavior);
  }

  @Transactional
  public void trackCartAdd(UUID userId, UUID bookId) {
    repository.save(new UserBehaviorEntity(userId, bookId, BehaviorType.CART_ADD));
  }

  @Transactional
  public void trackCartRemove(UUID userId, UUID bookId) {
    repository.save(new UserBehaviorEntity(userId, bookId, BehaviorType.CART_REMOVE));
  }

  @Transactional
  public void trackPurchase(UUID userId, UUID bookId) {
    repository.save(new UserBehaviorEntity(userId, bookId, BehaviorType.PURCHASE));
  }

  @Transactional
  public void trackCategoryView(UUID userId, String category, String subcategory) {
    UserBehaviorEntity behavior = new UserBehaviorEntity(userId, BehaviorType.CATEGORY_VIEW);
    behavior.setCategory(category);
    behavior.setSubcategory(subcategory);
    repository.save(behavior);
  }

  @Transactional
  public void trackWishlistAdd(UUID userId, UUID bookId) {
    repository.save(new UserBehaviorEntity(userId, bookId, BehaviorType.WISHLIST_ADD));
  }
}
















