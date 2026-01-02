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
    // Backend may return either "error" or "message" field
    const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
    throw new ApiError(
      errorMessage,
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
  
  // Merge headers properly - ensure Content-Type is always set
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  
  const config: RequestInit = {
    ...options,
    headers,
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
  
  // File upload helper
  uploadFile: async <T>(endpoint: string, file: File): Promise<T> => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('arka_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return handleResponse<T>(response);
  },
};

// Book API types
export interface BookResponse {
  id: string
  title: string
  author: string
  description: string
  genre: string | null
  category: string | null
  subcategory: string | null
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

// Donation API types
export interface NGOResponse {
  id: string
  name: string
  description: string | null
  location: string | null
  verified: boolean
  booksReceived: number | null
  categories: string[] | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
}

export interface DonationRequest {
  ngoId: string
  donorName: string
  donorEmail: string
  donorPhone: string
  donorType: 'INDIVIDUAL' | 'INSTITUTION'
  institutionName?: string
  bookCount: number
  bookCategories?: string[]
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
  pickupAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  additionalNotes?: string
  userId?: string
}

export interface DonationResponse {
  id: string
  ngoId: string
  ngoName: string
  donorName: string
  donorEmail: string
  donorPhone: string
  donorType: 'INDIVIDUAL' | 'INSTITUTION'
  institutionName: string | null
  bookCount: number
  bookCategories: string[] | null
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR'
  pickupAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  additionalNotes: string | null
  status: 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  userId: string | null
  createdAt: string
  updatedAt: string
}

// Book API functions
export const booksApi = {
  list: (params?: { search?: string; genre?: string; subcategory?: string; page?: number; size?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.genre) searchParams.append('genre', params.genre)
    if (params?.subcategory) searchParams.append('subcategory', params.subcategory)
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.size) searchParams.append('size', params.size.toString())
    
    const query = searchParams.toString()
    return api.get<BookResponse[]>(`/api/v1/books${query ? `?${query}` : ''}`)
  },
  
  create: (ownerId: string, data: { title: string; author: string; description?: string; genre?: string; price: number; imageUrl?: string }) => {
    const params = new URLSearchParams()
    params.append('ownerId', ownerId)
    return api.post<{ id: string }>(`/api/v1/books?${params}`, data)
  },
  
  getById: (id: string) =>
    api.get<BookResponse>(`/api/v1/books/${id}`),
  
  update: (id: string, data: { title: string; author: string; description?: string; genre?: string; price: number; imageUrl?: string }) =>
    api.put<BookResponse>(`/api/v1/books/${id}`, data),
  
  delete: (id: string) =>
    api.delete<void>(`/api/v1/books/${id}`),
  
  updateStatus: (id: string, status: string) =>
    api.patch<BookResponse>(`/api/v1/books/${id}/status?status=${status}`),
  
  getMyBooks: (ownerId: string) =>
    api.get<BookResponse[]>(`/api/v1/books/my?ownerId=${ownerId}`),
  
  getGenres: () =>
    api.get<string[]>('/api/v1/books/genres'),
  
  getGenresWithSubcategories: () =>
    api.get<Array<{ genre: string; subcategories: string[] }>>('/api/v1/books/genres/with-subcategories'),
  
  search: (query: string) =>
    api.get<BookResponse[]>(`/api/v1/books?search=${encodeURIComponent(query)}`),
};

// File Upload API functions
export const uploadApi = {
  uploadBookImage: (file: File) =>
    api.uploadFile<{ url: string }>('/api/v1/upload/book-image', file),
  
  uploadStatusImage: (file: File) =>
    api.uploadFile<{ url: string }>('/api/v1/upload/status-image', file),
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

// Donation API functions
export const donationsApi = {
  getNGOs: () =>
    api.get<NGOResponse[]>('/api/v1/donations/ngos'),
  
  createDonation: (data: DonationRequest) =>
    api.post<DonationResponse>('/api/v1/donations', data),
  
  getMyDonations: (userId: string) =>
    api.get<DonationResponse[]>(`/api/v1/donations/my?userId=${userId}`),
  
  getDonation: (donationId: string) =>
    api.get<DonationResponse>(`/api/v1/donations/${donationId}`),
  
  cancelDonation: (donationId: string) =>
    api.delete<DonationResponse>(`/api/v1/donations/${donationId}`),
};

// Admin API functions
export const adminApi = {
  login: (email: string, password: string) => {
    return api.post<{
      token: string
      userId: string
      email: string
      firstName: string
      lastName: string
    }>('/api/admin/auth/login', { email, password })
  },
  
  getNGOs: () => {
    const token = localStorage.getItem('arka_admin_token')
    return api.get<NGOResponse[]>('/api/admin/donations/ngos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },
  
  createNGO: (data: CreateNGORequest) => {
    const token = localStorage.getItem('arka_admin_token')
    return api.post<NGOResponse>('/api/admin/donations/ngos', data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },
  
  updateNGO: (ngoId: string, data: UpdateNGORequest) => {
    const token = localStorage.getItem('arka_admin_token')
    return api.put<NGOResponse>(`/api/admin/donations/ngos/${ngoId}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },
  
  deleteNGO: (ngoId: string) => {
    const token = localStorage.getItem('arka_admin_token')
    return api.delete<void>(`/api/admin/donations/ngos/${ngoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },
  
  verifyNGO: (ngoId: string) => {
    const token = localStorage.getItem('arka_admin_token')
    return api.put<NGOResponse>(`/api/admin/donations/ngos/${ngoId}/verify`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  },
};

// Demand/Book Requests API types
export interface BookRequestResponse {
  id: string
  requesterId: string
  requesterName: string
  requesterEmail: string | null
  title: string
  author: string
  description: string | null
  genre: string | null
  category: string | null
  subcategory: string | null
  isbn: string | null
  maxPrice: number | null
  preferredCondition: string | null
  urgency: string | null
  location: string | null
  additionalNotes: string | null
  status: 'OPEN' | 'FULFILLED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  expiresAt: string | null
  fulfilledBy: string | null
  fulfilledByName: string | null
  fulfilledAt: string | null
  viewsCount: number
  offersCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateBookRequestRequest {
  title: string
  author: string
  description?: string
  genre?: string
  category?: string
  subcategory?: string
  isbn?: string
  maxPrice?: number
  preferredCondition?: string
  urgency?: string
  location?: string
  additionalNotes?: string
  expiresAt?: string
}

export interface FulfillRequestRequest {
  bookId: string
  offeredPrice: number
  condition: string
  notes?: string
}

// Demand/Book Requests API functions
export const demandApi = {
  createRequest: (requesterId: string, data: CreateBookRequestRequest) =>
    api.post<CreateRequestResponse>(`/api/v1/demand/requests?requesterId=${requesterId}`, data),
  
  getOpenRequests: () =>
    api.get<BookRequestResponse[]>('/api/v1/demand/requests'),
  
  getMyRequests: (userId: string) =>
    api.get<BookRequestResponse[]>(`/api/v1/demand/requests/my?userId=${userId}`),
  
  getRequest: (requestId: string) =>
    api.get<BookRequestResponse>(`/api/v1/demand/requests/${requestId}`),
  
  searchRequests: (query: string) =>
    api.get<BookRequestResponse[]>(`/api/v1/demand/requests?search=${encodeURIComponent(query)}`),
  
  fulfillRequest: (requestId: string, sellerId: string, data: FulfillRequestRequest) =>
    api.put<BookRequestResponse>(`/api/v1/demand/requests/${requestId}/fulfill?sellerId=${sellerId}`, data),
  
  cancelRequest: (requestId: string, userId: string) =>
    api.delete<BookRequestResponse>(`/api/v1/demand/requests/${requestId}?userId=${userId}`),
  
  getMatchesForRequest: (requestId: string, userId: string) => {
    const params = new URLSearchParams()
    params.append('userId', userId)
    return api.get<MatchResponse[]>(`/api/v1/demand/requests/${requestId}/matches?${params}`)
  },
  
  getMatchesForBook: (bookId: string, sellerId: string) =>
    api.get<RequestMatchResponse[]>(`/api/v1/demand/books/${bookId}/matches?sellerId=${sellerId}`),
  
  getAutoFillSuggestions: (userId: string) =>
    api.get<AutoFillSuggestions>(`/api/v1/demand/requests/autofill?userId=${userId}`),
  
  getQuickSuggestions: (userId: string, query: string, fieldType: string) =>
    api.get<string[]>(`/api/v1/demand/requests/suggestions?userId=${userId}&query=${encodeURIComponent(query)}&fieldType=${fieldType}`),
  
  getRecentlyServedRequests: (limit?: number) =>
    api.get<BookRequestResponse[]>(`/api/v1/demand/requests/recently-served${limit ? `?limit=${limit}` : ''}`),
  
  getWeeklyStats: () =>
    api.get<WeeklyStats>(`/api/v1/demand/requests/stats/weekly`),
  
  getMostRequestedBooks: (limit: number = 5) => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    return api.get<Array<{ title: string; author: string; requestCount: number }>>(
      `/api/v1/demand/requests/most-requested?${params}`
    )
  },
};

export interface WeeklyStats {
  openRequests: number
  completedThisWeek: number
  createdThisWeek: number
}

export interface MatchResponse {
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookGenre: string | null
  bookPrice: number
  bookImageUrl: string | null
  sellerId: string
  sellerName: string
  matchScore: number
  matchReasons: string[]
}

export interface CreateRequestResponse {
  request: BookRequestResponse
  matches: MatchResponse[]
  totalMatches: number
}

export interface RequestMatchResponse {
  requestId: string
  requestTitle: string
  requestAuthor: string
  requestGenre: string | null
  maxPrice: number | null
  urgency: string | null
  location: string | null
  viewsCount: number
  matchScore: number
  matchReasons: string[]
}

export interface AutoFillSuggestions {
  recentSearches: string[]
  suggestedGenres: string[]
  recentlyViewedBooks: Array<{
    title: string
    author: string
    genre: string | null
  }>
  popularGenres: string[]
}

export interface CreateNGORequest {
  name: string
  description?: string
  location?: string
  categories?: string[]
  contactEmail?: string
  contactPhone?: string
  website?: string
  verified?: boolean
}

export interface UpdateNGORequest {
  name?: string
  description?: string
  location?: string
  categories?: string[]
  contactEmail?: string
  contactPhone?: string
  website?: string
  verified?: boolean
}

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
  create: (data: CreateExchangeRequest, buyerId?: string) => {
    const url = buyerId 
      ? `/api/v1/exchanges?buyerId=${buyerId}`
      : '/api/v1/exchanges'
    return api.post<ExchangeResponse>(url, data)
  },
  
  getMyExchanges: (userId?: string) => {
    const url = userId
      ? `/api/v1/exchanges/my?userId=${userId}`
      : '/api/v1/exchanges/my'
    return api.get<ExchangeResponse[]>(url)
  },
  
  getBookExchanges: (bookId: string) =>
    api.get<ExchangeResponse[]>(`/api/v1/exchanges/book/${bookId}`),
  
  confirm: (exchangeId: string, sellerId?: string) => {
    const url = sellerId
      ? `/api/v1/exchanges/${exchangeId}/confirm?sellerId=${sellerId}`
      : `/api/v1/exchanges/${exchangeId}/confirm`
    return api.put<ExchangeResponse>(url)
  },
  
  complete: (exchangeId: string, buyerId?: string) => {
    const url = buyerId
      ? `/api/v1/exchanges/${exchangeId}/complete?buyerId=${buyerId}`
      : `/api/v1/exchanges/${exchangeId}/complete`
    return api.put<ExchangeResponse>(url)
  },
  
  cancel: (exchangeId: string, userId?: string) => {
    const url = userId
      ? `/api/v1/exchanges/${exchangeId}?userId=${userId}`
      : `/api/v1/exchanges/${exchangeId}`
    return api.delete<ExchangeResponse>(url)
  },
  
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
  host: string
  members: number
  activeChains: number
  streakDays: number
  tags: string[]
  badge: string
}

export interface ChainParticipant {
  name: string
  location: string
  handoff: string
}

export interface ChainStoryResponse {
  id: string
  title: string
  chainBadge: string
  coverLabel: string
  streakDays: number
  hops: number
  lastHop: string
  participants: ChainParticipant[]
}

export interface ChainActionResponse {
  chainId: string
  status: string
  streakDays: number
  lastHop: string
}

// Community API types
export interface CreateChainRequest {
  title: string
  bookId: string
  description?: string
}

// Community API functions
// Wishlist API types
export interface WishlistItemResponse {
  wishlistId: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookGenre: string | null
  bookDescription: string | null
  bookPrice: number
  bookImageUrl: string | null
  bookStatus: string
  bookOwnerId: string
  bookOwnerName: string
  notes: string | null
  addedAt: string
}

export interface AddToWishlistRequest {
  notes?: string
}

// Wishlist API functions
export const wishlistApi = {
  addToWishlist: (userId: string, bookId: string, data?: AddToWishlistRequest) =>
    api.post<WishlistItemResponse>(`/api/v1/wishlist/items?userId=${userId}&bookId=${bookId}`, data || {}),
  
  removeFromWishlist: (userId: string, bookId: string) =>
    api.delete<{ message: string }>(`/api/v1/wishlist/items?userId=${userId}&bookId=${bookId}`),
  
  getWishlist: (userId: string) =>
    api.get<WishlistItemResponse[]>(`/api/v1/wishlist/items?userId=${userId}`),
  
  checkInWishlist: (userId: string, bookId: string) =>
    api.get<{ isInWishlist: boolean }>(`/api/v1/wishlist/items/check?userId=${userId}&bookId=${bookId}`),
  
  getWishlistCount: (userId: string) =>
    api.get<{ count: number }>(`/api/v1/wishlist/count?userId=${userId}`),
};

// Bookshelf API types
export interface BookshelfItemResponse {
  id: string
  userId: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookImageUrl: string | null
  bookPrice: number
  notes: string | null
  addedAt: string
}

export interface AddToBookshelfRequest {
  notes?: string
}

// Bookshelf API functions
export const bookshelfApi = {
  addToBookshelf: (userId: string, bookId: string, data?: AddToBookshelfRequest) =>
    api.post<BookshelfItemResponse>(`/api/v1/bookshelf?userId=${userId}&bookId=${bookId}`, data || {}),
  
  removeFromBookshelf: (userId: string, bookId: string) =>
    api.delete<{ message: string }>(`/api/v1/bookshelf/${bookId}?userId=${userId}`),
  
  getBookshelf: (userId: string) =>
    api.get<BookshelfItemResponse[]>(`/api/v1/bookshelf?userId=${userId}`),
  
  checkInBookshelf: (userId: string, bookId: string) =>
    api.get<{ isInBookshelf: boolean }>(`/api/v1/bookshelf/check?userId=${userId}&bookId=${bookId}`),
  
  getBookshelfCount: (userId: string) =>
    api.get<{ count: number }>(`/api/v1/bookshelf/count?userId=${userId}`),
}

// Trust Score API types
export interface TrustScoreResponse {
  userId: string
  trustScore: number
  conditionAccuracyScore: number
  conditionAssessmentsCount: number
  accurateConditionCount: number
  showupReliabilityScore: number
  pickupCommitmentsCount: number
  successfulShowupsCount: number
  noShowsCount: number
  responseTimeScore: number
  averageResponseTimeHours: number
  requestsRespondedCount: number
  completionRate: number
  totalTransactions: number
  completedTransactions: number
  cancellationRate: number
  cancelledTransactions: number
  lastCalculatedAt: string
}

// Trust Score API functions
export const trustScoreApi = {
  getTrustScore: (userId: string) =>
    api.get<TrustScoreResponse>(`/api/v1/trustscore?userId=${userId}`),
}

export const communityApi = {
  getCircles: () =>
    api.get<CommunityCircleResponse[]>('/api/v1/community/circles'),
  
  getCircleById: (circleId: string) =>
    api.get<CommunityCircleResponse>(`/api/v1/community/circles/${circleId}`),
  
  getCircleBooks: (circleId: string, page?: number, size?: number) => {
    const params = new URLSearchParams()
    if (page !== undefined) params.append('page', page.toString())
    if (size !== undefined) params.append('size', size.toString())
    return api.get<BookResponse[]>(`/api/v1/community/circles/${circleId}/books?${params.toString()}`)
  },
  
  getChains: () =>
    api.get<ChainStoryResponse[]>('/api/v1/community/chains'),
  
  createChain: (data: CreateChainRequest) =>
    api.post<ChainStoryResponse>('/api/v1/community/chains', data),
  
  pingChain: (chainId: string) =>
    api.post<ChainActionResponse>(`/api/v1/community/chains/${chainId}/ping`),
  
  keepChainAlive: (chainId: string) =>
    api.post<ChainActionResponse>(`/api/v1/community/chains/${chainId}/keep-alive`),
};

// Order API types
export interface OrderItemRequest {
  bookId: string
  quantity: number
}

export interface CreateOrderRequest {
  items: OrderItemRequest[]
  shippingAddress: string
  pickupTime?: string
  paymentMethod: string
  contactPhone?: string
  specialInstructions?: string
}

export interface OrderItemResponse {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderResponse {
  id: string
  userId: string
  items: OrderItemResponse[]
  totalAmount: number
  pickupFee: number
  status: string
  shippingAddress: string
  pickupTime?: string
  paymentMethod: string
  contactPhone?: string
  specialInstructions?: string
  trackingNumber: string
  createdAt: string
  updatedAt?: string
}

export interface TrackingStep {
  id: string
  title: string
  description: string
  date?: string
  completed: boolean
}

export interface OrderTrackingResponse {
  orderId: string
  trackingNumber: string
  status: string
  steps: TrackingStep[]
  estimatedDelivery: string
}

// Order API functions
export const ordersApi = {
  create: (userId: string, data: CreateOrderRequest) =>
    api.post<OrderResponse>(`/api/v1/orders?userId=${userId}`, data),
  
  getMyOrders: (userId: string) =>
    api.get<OrderResponse[]>(`/api/v1/orders/my?userId=${userId}`),
  
  getById: (orderId: string, userId: string) =>
    api.get<OrderResponse>(`/api/v1/orders/${orderId}?userId=${userId}`),
  
  getTracking: (orderId: string, userId: string) =>
    api.get<OrderTrackingResponse>(`/api/v1/orders/${orderId}/tracking?userId=${userId}`),
};

// User API types
export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  creditBalance: number
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
}

// User API functions
export const usersApi = {
  getById: (id: string) =>
    api.get<UserResponse>(`/api/v1/users/${id}`),
  
  update: (id: string, data: UpdateUserRequest) =>
    api.put<UserResponse>(`/api/v1/users/${id}`, data),
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









