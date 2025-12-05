// Use relative URL when deployed (same ALB serves both frontend and backend)
// Fallback to localhost for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:8080');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text() as unknown as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
  
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Book API types
export interface BookResponse {
  id: string
  title: string
  author: string
  description: string
  genre: string | null
  price: number | null
  status: string
  createdAt: string
  isbn: string | null
  publisher: string | null
  publicationYear: number | null
  imageUrl: string | null
  thumbnailUrl: string | null
  averageRating: number | null
  ratingsCount: number | null
}

// Recycling API types
export interface WastePaperResponse {
  id: string
  title: string
  description: string
  category: string | null
  weightKg: number
  creditValue: number
  status: string
  createdAt: string
}

// Book API functions
export const booksApi = {
  list: (params?: { search?: string; genre?: string; page?: number; size?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.genre) searchParams.append('genre', params.genre)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.size) searchParams.append('size', params.size.toString())
    
    const query = searchParams.toString()
    return api.get<BookResponse[]>(`/api/v1/books${query ? `?${query}` : ''}`)
  },
  
  create: (data: { title: string; author: string; description?: string; genre?: string; price: number }) =>
    api.post<{ id: string }>('/api/v1/books', data),
};

// Recycling API functions
export const recyclingApi = {
  list: (params?: { search?: string; category?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.category) searchParams.append('category', params.category)
    
    const query = searchParams.toString()
    return api.get<WastePaperResponse[]>(`/api/v1/recycling${query ? `?${query}` : ''}`)
  },
};

// Exchange API types
export interface ExchangeResponse {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  sellerId: string
  sellerName: string
  buyerId: string
  buyerName: string
  creditAmount: number
  serviceFee: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface CreateExchangeRequest {
  bookId: string
}

export interface FeeCalculationResponse {
  bookPrice: number
  serviceFee: number
  totalCost: number
  serviceFeePercentage: string
}

// Exchange API functions
export const exchangesApi = {
  create: (data: CreateExchangeRequest) =>
    api.post<ExchangeResponse>('/api/v1/exchanges', data),
  
  getMyExchanges: () =>
    api.get<ExchangeResponse[]>('/api/v1/exchanges/my'),
  
  getBookExchanges: (bookId: string) =>
    api.get<ExchangeResponse[]>(`/api/v1/exchanges/book/${bookId}`),
  
  confirm: (exchangeId: string) =>
    api.put<ExchangeResponse>(`/api/v1/exchanges/${exchangeId}/confirm`),
  
  complete: (exchangeId: string) =>
    api.put<ExchangeResponse>(`/api/v1/exchanges/${exchangeId}/complete`),
  
  cancel: (exchangeId: string) =>
    api.delete<ExchangeResponse>(`/api/v1/exchanges/${exchangeId}`),
  
  calculateFee: (bookPrice: number) => {
    const params = new URLSearchParams()
    params.append('bookPrice', bookPrice.toString())
    return api.get<FeeCalculationResponse>(`/api/v1/exchanges/fee?${params}`)
  },
};

// Recommendation API functions
export const recommendationsApi = {
  getRecommendations: (userId?: string, limit: number = 10) => {
    const params = new URLSearchParams()
    if (userId) params.append('userId', userId)
    params.append('limit', limit.toString())
    return api.get<BookResponse[]>(`/api/v1/recommendations?${params}`)
  },
  
  getPopular: (limit: number = 10) => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    return api.get<BookResponse[]>(`/api/v1/recommendations/popular?${params}`)
  },
  
  getSimilar: (bookId: string, limit: number = 5) => {
    const params = new URLSearchParams()
    params.append('bookId', bookId)
    params.append('limit', limit.toString())
    return api.get<BookResponse[]>(`/api/v1/recommendations/similar?${params}`)
  },
  
  getTrending: (category: string, limit: number = 10) => {
    const params = new URLSearchParams()
    params.append('category', category)
    params.append('limit', limit.toString())
    return api.get<BookResponse[]>(`/api/v1/recommendations/trending?${params}`)
  },
};

// Lending API types
export interface LendingResponse {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  ownerId: string
  ownerName: string
  borrowerId: string
  borrowerName: string
  requestedAt: string
  startDate: string | null
  expectedReturnDate: string
  actualReturnDate: string | null
  lendingFee: number
  deposit: number
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'REJECTED' | 'CANCELLED' | 'OVERDUE'
  notes: string | null
  conditionBefore: string | null
  conditionAfter: string | null
}

export interface CreateLendingRequest {
  bookId: string
  borrowerId: string
  expectedReturnDate: string
  lendingFee: number
  deposit: number
  notes?: string
}

// Lending API functions
export const lendingApi = {
  request: (data: CreateLendingRequest) =>
    api.post<LendingResponse>('/api/lending/request', data),
  
  approve: (lendingId: string, ownerId: string) =>
    api.put<LendingResponse>(`/api/lending/${lendingId}/approve?ownerId=${ownerId}`),
  
  reject: (lendingId: string, ownerId: string, reason?: string) => {
    const params = new URLSearchParams()
    params.append('ownerId', ownerId)
    if (reason) params.append('reason', reason)
    return api.put<LendingResponse>(`/api/lending/${lendingId}/reject?${params}`)
  },
  
  start: (lendingId: string, ownerId: string, conditionBefore?: string) => {
    const params = new URLSearchParams()
    params.append('ownerId', ownerId)
    if (conditionBefore) params.append('conditionBefore', conditionBefore)
    return api.put<LendingResponse>(`/api/lending/${lendingId}/start?${params}`)
  },
  
  return: (lendingId: string, borrowerId: string, conditionAfter?: string) => {
    const params = new URLSearchParams()
    params.append('borrowerId', borrowerId)
    if (conditionAfter) params.append('conditionAfter', conditionAfter)
    return api.put<LendingResponse>(`/api/lending/${lendingId}/return?${params}`)
  },
  
  getUserLendings: (userId: string) =>
    api.get<LendingResponse[]>(`/api/lending/user/${userId}`),
  
  getActiveLendings: (userId: string) =>
    api.get<LendingResponse[]>(`/api/lending/user/${userId}/active`),
};

// Subscription API types
export interface SubscriptionResponse {
  id: string
  userId: string
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'UNLIMITED'
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED' | 'PENDING_PAYMENT'
  startDate: string
  endDate: string | null
  renewalDate: string | null
  monthlyPrice: number | null
  autoRenew: boolean
  booksPerMonth: number | null
  booksUsedThisMonth: number | null
  unlimitedAccess: boolean
  prioritySupport: boolean
  adFree: boolean
}

export interface CreateSubscriptionRequest {
  userId: string
  plan: string
}

// Subscription API functions
export const subscriptionsApi = {
  create: (data: CreateSubscriptionRequest) =>
    api.post<SubscriptionResponse>('/api/subscriptions', data),
  
  getUserSubscription: (userId: string) =>
    api.get<SubscriptionResponse>(`/api/subscriptions/user/${userId}`),
  
  renew: (userId: string) =>
    api.put<SubscriptionResponse>(`/api/subscriptions/user/${userId}/renew`),
  
  cancel: (userId: string) =>
    api.delete<SubscriptionResponse>(`/api/subscriptions/user/${userId}`),
};

// Analytics API types
export interface UserAnalyticsResponse {
  userId: string
  userName: string
  totalBooksRead: number
  totalBooksBought: number
  totalBooksSold: number
  totalBooksLent: number
  totalBooksBorrowed: number
  totalSpent: number
  totalEarned: number
  favoriteGenres: string[]
  favoriteCategories: string[]
  readingStreak: number
  averageRatingGiven: number
  reviewsWritten: number
}

export interface BookAnalyticsResponse {
  bookId: string
  bookTitle: string
  bookAuthor: string
  totalViews: number
  totalPurchases: number
  totalLendings: number
  totalWishlistAdds: number
  averageRating: number | null
  ratingsCount: number | null
  popularityScore: number
  trendingStatus: string
  daysSincePublished: number
}

export interface PlatformInsightsResponse {
  totalUsers: number
  activeUsers: number
  totalBooks: number
  availableBooks: number
  totalExchanges: number
  totalLendings: number
  totalRevenue: number
  averageBookPrice: number
  booksByGenre: Record<string, number>
  booksByCategory: Record<string, number>
  trendingBooks: Array<{
    bookId: string
    title: string
    author: string
    views: number
    purchases: number
    popularityScore: number
  }>
  popularGenres: Array<{
    genre: string
    bookCount: number
    exchangeCount: number
    averagePrice: number
  }>
  monthlyStats: {
    newUsers: number
    newBooks: number
    exchanges: number
    lendings: number
    revenue: number
  }
  weeklyStats: {
    newUsers: number
    newBooks: number
    exchanges: number
    lendings: number
    revenue: number
  }
}

// Analytics API functions
export const analyticsApi = {
  getUserAnalytics: (userId: string) =>
    api.get<UserAnalyticsResponse>(`/api/analytics/user/${userId}`),
  
  getBookAnalytics: (bookId: string) =>
    api.get<BookAnalyticsResponse>(`/api/analytics/book/${bookId}`),
  
  getPlatformInsights: () =>
    api.get<PlatformInsightsResponse>('/api/analytics/platform'),
};

// Community API types
export interface CommunityCircleResponse {
  id: string
  name: string
  description: string
  moderator: string
  memberCount: number
  activeChains: number
  totalSwaps: number
  tags: string[]
  initials: string
}

export interface ChainStoryResponse {
  id: string
  title: string
  chainBadge: string
  coverLabel: string
  streakDays: number
  hops: number
  lastHop: string
  participants: Array<{
    name: string
    location: string
    handoff: string
  }>
}

export interface ChainActionResponse {
  chainId: string
  status: string
  streakDays: number
  lastHop: string
}

// Community API functions
export const communityApi = {
  getCircles: () =>
    api.get<CommunityCircleResponse[]>('/api/v1/community/circles'),
  
  getChains: () =>
    api.get<ChainStoryResponse[]>('/api/v1/community/chains'),
  
  pingChain: (chainId: string) =>
    api.post<ChainActionResponse>(`/api/v1/community/chains/${chainId}/ping`),
  
  keepChainAlive: (chainId: string) =>
    api.post<ChainActionResponse>(`/api/v1/community/chains/${chainId}/keep-alive`),
};

// User Behavior API functions
export const behaviorApi = {
  trackView: (userId: string, bookId: string, durationSeconds: number = 0) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    params.append('bookId', bookId)
    params.append('durationSeconds', durationSeconds.toString())
    return api.post<void>(`/api/v1/behavior/view?${params}`)
  },
  
  trackSearch: (userId: string, query?: string, category?: string, subcategory?: string) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    if (query) params.append('query', query)
    if (category) params.append('category', category)
    if (subcategory) params.append('subcategory', subcategory)
    return api.post<void>(`/api/v1/behavior/search?${params}`)
  },
  
  trackCartAdd: (userId: string, bookId: string) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    params.append('bookId', bookId)
    return api.post<void>(`/api/v1/behavior/cart/add?${params}`)
  },
  
  trackCartRemove: (userId: string, bookId: string) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    params.append('bookId', bookId)
    return api.post<void>(`/api/v1/behavior/cart/remove?${params}`)
  },
  
  trackPurchase: (userId: string, bookId: string) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    params.append('bookId', bookId)
    return api.post<void>(`/api/v1/behavior/purchase?${params}`)
  },
  
  trackCategoryView: (userId: string, category?: string, subcategory?: string) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    if (category) params.append('category', category)
    if (subcategory) params.append('subcategory', subcategory)
    return api.post<void>(`/api/v1/behavior/category/view?${params}`)
  },
};









