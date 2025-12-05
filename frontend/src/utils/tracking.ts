// User behavior tracking utility
import { behaviorApi } from './api'

// Get current user ID from auth context or localStorage
function getUserId(): string | null {
  try {
    const user = localStorage.getItem('arka_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id || null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return null;
}

// Track book view
export function trackBookView(bookId: string, durationSeconds: number = 0) {
  const userId = getUserId();
  if (!userId) return;

  behaviorApi.trackView(userId, bookId, durationSeconds).catch(error => {
    console.error('Error tracking book view:', error);
  });
}

// Track search
export function trackSearch(query: string, category?: string, subcategory?: string) {
  const userId = getUserId();
  if (!userId) return;

  behaviorApi.trackSearch(userId, query, category, subcategory).catch(error => {
    console.error('Error tracking search:', error);
  });
}

// Track cart add
export function trackCartAdd(bookId: string) {
  const userId = getUserId();
  if (!userId) return;

  behaviorApi.trackCartAdd(userId, bookId).catch(error => {
    console.error('Error tracking cart add:', error);
  });
}

// Track cart remove
export function trackCartRemove(bookId: string) {
  const userId = getUserId();
  if (!userId) return;

  behaviorApi.trackCartRemove(userId, bookId).catch(error => {
    console.error('Error tracking cart remove:', error);
  });
}

// Track purchase
export function trackPurchase(bookId: string) {
  const userId = getUserId();
  if (!userId) return;

  behaviorApi.trackPurchase(userId, bookId).catch(error => {
    console.error('Error tracking purchase:', error);
  });
}

// Track category view
export function trackCategoryView(category?: string, subcategory?: string) {
  const userId = getUserId();
  if (!userId) return;

  behaviorApi.trackCategoryView(userId, category, subcategory).catch(error => {
    console.error('Error tracking category view:', error);
  });
}












