import { supabase } from '../lib/supabaseClient'

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

type SupabaseBookRow = {
  id: string
  title: string
  author: string
  description: string | null
  genre: string | null
  category: string | null
  subcategory: string | null
  credit_price: number | null
  status: string
  created_at: string
  owner_id: string | null
}

function mapSupabaseBook(row: SupabaseBookRow): BookResponse {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description ?? '',
    genre: row.genre,
    category: row.category,
    subcategory: row.subcategory,
    price: row.credit_price,
    status: row.status,
    createdAt: row.created_at,
    isbn: null,
    publisher: null,
    publicationYear: null,
    imageUrl: null,
    thumbnailUrl: null,
    averageRating: null,
    ratingsCount: null,
  }
}

function asErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message ?? 'Supabase error')
  }
  return 'Supabase error'
}

// Book API functions
export const booksApi = {
  list: async (params?: { search?: string; genre?: string; subcategory?: string; page?: number; size?: number }) => {
    try {
      let query = supabase
        .from('books')
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id')
        .order('created_at', { ascending: false })

      if (params?.search) query = query.ilike('title', `%${params.search}%`)
      if (params?.genre) query = query.eq('genre', params.genre)
      if (params?.subcategory) query = query.eq('subcategory', params.subcategory)
      if (params?.page !== undefined && params?.size) {
        const from = params.page * params.size
        const to = from + params.size - 1
        query = query.range(from, to)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map((row) => mapSupabaseBook(row as SupabaseBookRow))
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  create: async (ownerId: string, data: { title: string; author: string; description?: string; genre?: string; price: number; imageUrl?: string }) => {
    try {
      const { data: inserted, error } = await supabase
        .from('books')
        .insert({
          owner_id: ownerId,
          title: data.title,
          author: data.author,
          description: data.description ?? null,
          genre: data.genre ?? null,
          credit_price: data.price,
          status: 'AVAILABLE',
        })
        .select('id')
        .single()
      if (error) throw error
      return { id: inserted.id as string }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id')
        .eq('id', id)
        .single()
      if (error) throw error
      return mapSupabaseBook(data as SupabaseBookRow)
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  update: async (id: string, data: { title: string; author: string; description?: string; genre?: string; price: number; imageUrl?: string }) => {
    try {
      const { data: updated, error } = await supabase
        .from('books')
        .update({
          title: data.title,
          author: data.author,
          description: data.description ?? null,
          genre: data.genre ?? null,
          credit_price: data.price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id')
        .single()
      if (error) throw error
      return mapSupabaseBook(updated as SupabaseBookRow)
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  delete: async (id: string) => {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
      return
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  updateStatus: async (id: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id')
        .single()
      if (error) throw error
      return mapSupabaseBook(data as SupabaseBookRow)
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getMyBooks: async (ownerId: string) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => mapSupabaseBook(row as SupabaseBookRow))
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getGenres: async () => {
    try {
      const { data, error } = await supabase.from('books').select('genre').not('genre', 'is', null)
      if (error) throw error
      const genres = Array.from(new Set((data ?? []).map((d) => d.genre).filter(Boolean)))
      return genres as string[]
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getGenresWithSubcategories: async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('genre,subcategory')
        .not('genre', 'is', null)
      if (error) throw error
      const grouped = new Map<string, Set<string>>()
      for (const row of data ?? []) {
        const genre = row.genre as string
        if (!grouped.has(genre)) grouped.set(genre, new Set<string>())
        if (row.subcategory) grouped.get(genre)!.add(row.subcategory as string)
      }
      return Array.from(grouped.entries()).map(([genre, subcategories]) => ({
        genre,
        subcategories: Array.from(subcategories),
      }))
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
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
  list: async () => [],
};

// Donation API functions
export const donationsApi = {
  getNGOs: async () => {
    const { data, error } = await supabase.from('ngos').select('*').order('name')
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((n: any) => ({
      id: n.id,
      name: n.name,
      description: n.description ?? null,
      location: null,
      verified: !!n.verified,
      booksReceived: null,
      categories: null,
      contactEmail: n.contact_email ?? null,
      contactPhone: n.contact_phone ?? null,
      website: n.website ?? null,
    }))
  },
  createDonation: async (data: DonationRequest) => {
    const { data: created, error } = await supabase.rpc('create_donation', {
      p_ngo_id: data.ngoId,
      p_item_count: data.bookCount,
      p_notes: data.additionalNotes ?? null,
      p_idempotency_key: crypto.randomUUID(),
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: created.id,
      ngoId: created.ngo_id,
      ngoName: '',
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
      donorType: data.donorType,
      institutionName: data.institutionName ?? null,
      bookCount: created.item_count,
      bookCategories: data.bookCategories ?? null,
      condition: data.condition,
      pickupAddress: data.pickupAddress,
      additionalNotes: created.notes ?? null,
      status: created.status,
      userId: created.user_id ?? null,
      createdAt: created.created_at,
      updatedAt: created.updated_at ?? created.created_at,
    } as DonationResponse
  },
  getMyDonations: async (userId: string) => {
    const { data, error } = await supabase
      .from('donations')
      .select('*, ngos:ngo_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((d: any) => ({
      id: d.id,
      ngoId: d.ngo_id,
      ngoName: d.ngos?.name ?? '',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      donorType: 'INDIVIDUAL',
      institutionName: null,
      bookCount: d.item_count ?? 1,
      bookCategories: null,
      condition: 'GOOD',
      pickupAddress: { street: '', city: '', state: '', pincode: '' },
      additionalNotes: d.notes ?? null,
      status: d.status,
      userId: d.user_id ?? null,
      createdAt: d.created_at,
      updatedAt: d.updated_at ?? d.created_at,
    }))
  },
  getDonation: async (donationId: string) => {
    const { data, error } = await supabase
      .from('donations')
      .select('*, ngos:ngo_id(name)')
      .eq('id', donationId)
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id,
      ngoId: data.ngo_id,
      ngoName: data.ngos?.name ?? '',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      donorType: 'INDIVIDUAL',
      institutionName: null,
      bookCount: data.item_count ?? 1,
      bookCategories: null,
      condition: 'GOOD',
      pickupAddress: { street: '', city: '', state: '', pincode: '' },
      additionalNotes: data.notes ?? null,
      status: data.status,
      userId: data.user_id ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at ?? data.created_at,
    } as DonationResponse
  },
  cancelDonation: async (donationId: string) => {
    const { data, error } = await supabase
      .from('donations')
      .update({ status: 'CANCELLED' })
      .eq('id', donationId)
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id,
      ngoId: data.ngo_id,
      ngoName: '',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      donorType: 'INDIVIDUAL',
      institutionName: null,
      bookCount: data.item_count ?? 1,
      bookCategories: null,
      condition: 'GOOD',
      pickupAddress: { street: '', city: '', state: '', pincode: '' },
      additionalNotes: data.notes ?? null,
      status: data.status,
      userId: data.user_id ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at ?? data.created_at,
    } as DonationResponse
  },
};

// Admin API functions
export const adminApi = {
  login: async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !authData.user) throw new ApiError(authError?.message ?? 'Invalid credentials', 401, authError)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id,email,first_name,last_name,is_admin')
      .eq('id', authData.user.id)
      .single()
    if (profileError) throw new ApiError(asErrorMessage(profileError), 500, profileError)
    if (!profile?.is_admin) throw new ApiError('Admin access denied', 403)
    return {
      token: authData.session?.access_token ?? '',
      userId: profile.id,
      email: profile.email,
      firstName: profile.first_name ?? '',
      lastName: profile.last_name ?? '',
    }
  },
  
  getNGOs: () => donationsApi.getNGOs(),
  
  createNGO: async (data: CreateNGORequest) => {
    const { data: created, error } = await supabase.from('ngos').insert({
      name: data.name,
      description: data.description ?? null,
      contact_email: data.contactEmail ?? null,
      contact_phone: data.contactPhone ?? null,
      website: data.website ?? null,
      verified: !!data.verified,
    }).select('*').single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: created.id,
      name: created.name,
      description: created.description ?? null,
      location: null,
      verified: !!created.verified,
      booksReceived: null,
      categories: null,
      contactEmail: created.contact_email ?? null,
      contactPhone: created.contact_phone ?? null,
      website: created.website ?? null,
    }
  },
  
  updateNGO: async (ngoId: string, data: UpdateNGORequest) => {
    const { data: updated, error } = await supabase.from('ngos').update({
      name: data.name,
      description: data.description,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      website: data.website,
      verified: data.verified,
    }).eq('id', ngoId).select('*').single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: updated.id, name: updated.name, description: updated.description ?? null, location: null,
      verified: !!updated.verified, booksReceived: null, categories: null,
      contactEmail: updated.contact_email ?? null, contactPhone: updated.contact_phone ?? null, website: updated.website ?? null,
    }
  },
  
  deleteNGO: async (ngoId: string) => {
    const { error } = await supabase.from('ngos').delete().eq('id', ngoId)
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
  },
  
  verifyNGO: async (ngoId: string) => adminApi.updateNGO(ngoId, { verified: true }),
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
  createRequest: async (_requesterId: string, data: CreateBookRequestRequest) => {
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .ilike('title', data.title)
      .ilike('author', data.author)
      .limit(1)
      .maybeSingle()
    if (bookError) throw new ApiError(asErrorMessage(bookError), 500, bookError)
    if (!book?.id) throw new ApiError('No matching book found to create request', 400)
    const { data: req, error } = await supabase.rpc('create_request', {
      p_book_id: book.id,
      p_notes: data.additionalNotes ?? data.description ?? null,
      p_idempotency_key: crypto.randomUUID(),
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return { request: req as unknown as BookRequestResponse, matches: [], totalMatches: 0 }
  },
  
  getOpenRequests: async () => {
    const { data, error } = await supabase.from('v_open_book_requests').select('*').order('created_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []) as unknown as BookRequestResponse[]
  },
  
  getMyRequests: async (userId: string) => {
    const { data, error } = await supabase.from('book_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []) as unknown as BookRequestResponse[]
  },
  
  getRequest: async (requestId: string) => {
    const { data, error } = await supabase.from('book_requests').select('*').eq('id', requestId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return data as unknown as BookRequestResponse
  },
  
  searchRequests: async (_query: string) => demandApi.getOpenRequests(),
  
  fulfillRequest: async (requestId: string, _sellerId: string, data: FulfillRequestRequest) => {
    const { data: updated, error } = await supabase
      .from('book_requests')
      .update({ status: 'FULFILLED', updated_at: new Date().toISOString(), matching_metadata: { offeredPrice: data.offeredPrice, condition: data.condition, notes: data.notes ?? null } })
      .eq('id', requestId)
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return updated as unknown as BookRequestResponse
  },
  
  cancelRequest: async (requestId: string, _userId: string) => {
    const { data, error } = await supabase.rpc('cancel_request', { p_request_id: requestId })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return data as unknown as BookRequestResponse
  },
  
  getMatchesForRequest: async () => [],
  
  getMatchesForBook: async () => [],
  
  getAutoFillSuggestions: async () => ({ recentSearches: [], suggestedGenres: [], recentlyViewedBooks: [], popularGenres: [] }),
  
  getQuickSuggestions: async () => [],
  
  getRecentlyServedRequests: async (limit?: number) => {
    const rows = await demandApi.getOpenRequests()
    return rows.slice(0, limit ?? 20)
  },
  
  getWeeklyStats: async () => ({ openRequests: 0, completedThisWeek: 0, createdThisWeek: 0 }),
  
  getMostRequestedBooks: async () => [],
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
  create: async (data: CreateExchangeRequest, buyerId?: string) => {
    if (!buyerId) throw new ApiError('buyerId is required', 400)
    const { data: book, error: bookError } = await supabase.from('books').select('owner_id,credit_price').eq('id', data.bookId).single()
    if (bookError) throw new ApiError(asErrorMessage(bookError), 500, bookError)
    if (!book.owner_id) throw new ApiError('Book owner missing', 400)
    const { data: created, error } = await supabase.rpc('perform_exchange', {
      p_seller_id: book.owner_id,
      p_book_id: data.bookId,
      p_request_id: null,
      p_gross_amount: Number(book.credit_price ?? 1),
      p_platform_fee: 0,
      p_idempotency_key: crypto.randomUUID(),
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return created as unknown as ExchangeResponse
  },
  
  getMyExchanges: async (userId?: string) => {
    let query = supabase.from('exchanges').select('*').order('created_at', { ascending: false })
    if (userId) query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    const { data, error } = await query
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []) as unknown as ExchangeResponse[]
  },
  
  getBookExchanges: async (bookId: string) => {
    const { data, error } = await supabase.from('exchanges').select('*').eq('book_id', bookId)
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []) as unknown as ExchangeResponse[]
  },
  
  confirm: async (exchangeId: string) => {
    const { data, error } = await supabase.from('exchanges').select('*').eq('id', exchangeId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return data as unknown as ExchangeResponse
  },
  
  complete: async (exchangeId: string) => {
    const { data, error } = await supabase.from('exchanges').select('*').eq('id', exchangeId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return data as unknown as ExchangeResponse
  },
  
  cancel: async (exchangeId: string) => {
    const { data, error } = await supabase.from('exchanges').select('*').eq('id', exchangeId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return data as unknown as ExchangeResponse
  },
  
  calculateFee: async (bookPrice: number) => ({
    bookPrice,
    serviceFee: Math.round(bookPrice * 0.05 * 100) / 100,
    totalCost: Math.round(bookPrice * 1.05 * 100) / 100,
    serviceFeePercentage: '5',
  }),
};

// Recommendation API functions
export const recommendationsApi = {
  getRecommendations: async (_userId?: string, limit: number = 10) => booksApi.list({ size: limit, page: 0 }),
  
  getPopular: async (limit: number = 10) => booksApi.list({ size: limit, page: 0 }),
  
  getSimilar: async (_bookId: string, limit: number = 5) => booksApi.list({ size: limit, page: 0 }),
  
  getTrending: async (_category: string, limit: number = 10) => booksApi.list({ size: limit, page: 0 }),
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
  request: async (data: CreateLendingRequest) => {
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('author,title,owner_id')
      .eq('id', data.bookId)
      .single()
    if (bookError) throw new ApiError(asErrorMessage(bookError), 500, bookError)
    const { data: inserted, error } = await supabase
      .from('lendings')
      .insert({
        book_id: data.bookId,
        owner_id: book.owner_id,
        borrower_id: data.borrowerId,
        expected_return_date: data.expectedReturnDate,
        lending_fee: data.lendingFee,
        deposit: data.deposit,
        notes: data.notes ?? null,
        status: 'PENDING',
      })
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: inserted.id,
      bookId: inserted.book_id,
      bookTitle: book.title ?? '',
      bookAuthor: book.author ?? '',
      ownerId: inserted.owner_id,
      ownerName: '',
      borrowerId: inserted.borrower_id,
      borrowerName: '',
      requestedAt: inserted.requested_at,
      startDate: inserted.start_date,
      expectedReturnDate: inserted.expected_return_date,
      actualReturnDate: inserted.actual_return_date,
      lendingFee: Number(inserted.lending_fee ?? 0),
      deposit: Number(inserted.deposit ?? 0),
      status: inserted.status,
      notes: inserted.notes ?? null,
      conditionBefore: inserted.condition_before ?? null,
      conditionAfter: inserted.condition_after ?? null,
    }
  },
  
  approve: async (lendingId: string) => {
    const { data, error } = await supabase
      .from('lendings')
      .update({ status: 'APPROVED' })
      .eq('id', lendingId)
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id, bookId: data.book_id, bookTitle: '', bookAuthor: '', ownerId: data.owner_id, ownerName: '',
      borrowerId: data.borrower_id, borrowerName: '', requestedAt: data.requested_at, startDate: data.start_date,
      expectedReturnDate: data.expected_return_date, actualReturnDate: data.actual_return_date,
      lendingFee: Number(data.lending_fee ?? 0), deposit: Number(data.deposit ?? 0), status: data.status,
      notes: data.notes ?? null, conditionBefore: data.condition_before ?? null, conditionAfter: data.condition_after ?? null,
    }
  },
  
  reject: async (lendingId: string) => {
    const { data, error } = await supabase
      .from('lendings')
      .update({ status: 'REJECTED' })
      .eq('id', lendingId)
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id, bookId: data.book_id, bookTitle: '', bookAuthor: '', ownerId: data.owner_id, ownerName: '',
      borrowerId: data.borrower_id, borrowerName: '', requestedAt: data.requested_at, startDate: data.start_date,
      expectedReturnDate: data.expected_return_date, actualReturnDate: data.actual_return_date,
      lendingFee: Number(data.lending_fee ?? 0), deposit: Number(data.deposit ?? 0), status: data.status,
      notes: data.notes ?? null, conditionBefore: data.condition_before ?? null, conditionAfter: data.condition_after ?? null,
    }
  },
  
  start: async (lendingId: string, _ownerId: string, conditionBefore?: string) => {
    const { data, error } = await supabase
      .from('lendings')
      .update({ status: 'ACTIVE', start_date: new Date().toISOString(), condition_before: conditionBefore ?? null })
      .eq('id', lendingId)
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id, bookId: data.book_id, bookTitle: '', bookAuthor: '', ownerId: data.owner_id, ownerName: '',
      borrowerId: data.borrower_id, borrowerName: '', requestedAt: data.requested_at, startDate: data.start_date,
      expectedReturnDate: data.expected_return_date, actualReturnDate: data.actual_return_date,
      lendingFee: Number(data.lending_fee ?? 0), deposit: Number(data.deposit ?? 0), status: data.status,
      notes: data.notes ?? null, conditionBefore: data.condition_before ?? null, conditionAfter: data.condition_after ?? null,
    }
  },
  
  return: async (lendingId: string, _borrowerId: string, conditionAfter?: string) => {
    const { data, error } = await supabase
      .from('lendings')
      .update({ status: 'RETURNED', actual_return_date: new Date().toISOString(), condition_after: conditionAfter ?? null })
      .eq('id', lendingId)
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id, bookId: data.book_id, bookTitle: '', bookAuthor: '', ownerId: data.owner_id, ownerName: '',
      borrowerId: data.borrower_id, borrowerName: '', requestedAt: data.requested_at, startDate: data.start_date,
      expectedReturnDate: data.expected_return_date, actualReturnDate: data.actual_return_date,
      lendingFee: Number(data.lending_fee ?? 0), deposit: Number(data.deposit ?? 0), status: data.status,
      notes: data.notes ?? null, conditionBefore: data.condition_before ?? null, conditionAfter: data.condition_after ?? null,
    }
  },
  
  getUserLendings: async (userId: string) => {
    const { data, error } = await supabase
      .from('lendings')
      .select('*')
      .or(`owner_id.eq.${userId},borrower_id.eq.${userId}`)
      .order('requested_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((row: any) => ({
      id: row.id, bookId: row.book_id, bookTitle: '', bookAuthor: '', ownerId: row.owner_id, ownerName: '',
      borrowerId: row.borrower_id, borrowerName: '', requestedAt: row.requested_at, startDate: row.start_date,
      expectedReturnDate: row.expected_return_date, actualReturnDate: row.actual_return_date,
      lendingFee: Number(row.lending_fee ?? 0), deposit: Number(row.deposit ?? 0), status: row.status,
      notes: row.notes ?? null, conditionBefore: row.condition_before ?? null, conditionAfter: row.condition_after ?? null,
    }))
  },
  
  getActiveLendings: async (userId: string) => {
    const rows = await lendingApi.getUserLendings(userId)
    return rows.filter((r) => r.status === 'ACTIVE' || r.status === 'APPROVED')
  },
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
  create: async (data: CreateSubscriptionRequest) => {
    const { data: row, error } = await supabase.rpc('upsert_user_subscription', {
      p_user_id: data.userId,
      p_plan: data.plan,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: row.id,
      userId: row.user_id,
      plan: row.plan,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      renewalDate: row.renewal_date,
      monthlyPrice: row.monthly_price,
      autoRenew: row.auto_renew,
      booksPerMonth: row.books_per_month,
      booksUsedThisMonth: row.books_used_this_month,
      unlimitedAccess: row.unlimited_access,
      prioritySupport: row.priority_support,
      adFree: row.ad_free,
    }
  },
  
  getUserSubscription: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    if (!data) throw new ApiError('No subscription found', 404)
    return {
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      renewalDate: data.renewal_date,
      monthlyPrice: data.monthly_price,
      autoRenew: data.auto_renew,
      booksPerMonth: data.books_per_month,
      booksUsedThisMonth: data.books_used_this_month,
      unlimitedAccess: data.unlimited_access,
      prioritySupport: data.priority_support,
      adFree: data.ad_free,
    }
  },
  
  renew: async (userId: string) => {
    const { data, error } = await supabase.rpc('renew_user_subscription', {
      p_user_id: userId,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      renewalDate: data.renewal_date,
      monthlyPrice: data.monthly_price,
      autoRenew: data.auto_renew,
      booksPerMonth: data.books_per_month,
      booksUsedThisMonth: data.books_used_this_month,
      unlimitedAccess: data.unlimited_access,
      prioritySupport: data.priority_support,
      adFree: data.ad_free,
    }
  },
  
  cancel: async (userId: string) => {
    const { data, error } = await supabase.rpc('cancel_user_subscription', {
      p_user_id: userId,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      renewalDate: data.renewal_date,
      monthlyPrice: data.monthly_price,
      autoRenew: data.auto_renew,
      booksPerMonth: data.books_per_month,
      booksUsedThisMonth: data.books_used_this_month,
      unlimitedAccess: data.unlimited_access,
      prioritySupport: data.priority_support,
      adFree: data.ad_free,
    }
  },
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
  getUserAnalytics: async (userId: string) => {
    const { data, error } = await supabase.from('v_analytics_user_summary').select('*').eq('user_id', userId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      userId,
      userName: '',
      totalBooksRead: 0,
      totalBooksBought: 0,
      totalBooksSold: 0,
      totalBooksLent: 0,
      totalBooksBorrowed: 0,
      totalSpent: 0,
      totalEarned: 0,
      favoriteGenres: [],
      favoriteCategories: [],
      readingStreak: 0,
      averageRatingGiven: 0,
      reviewsWritten: Number(data.total_events ?? 0),
    }
  },
  
  getBookAnalytics: async (bookId: string) => {
    const { data, error } = await supabase.from('analytics_book_daily').select('*').eq('book_id', bookId)
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const totalViews = (data ?? []).reduce((acc: number, r: any) => acc + Number(r.total_events ?? 0), 0)
    const wishlistAdds = (data ?? []).reduce((acc: number, r: any) => acc + Number(r.wishlist_adds ?? 0), 0)
    return {
      bookId,
      bookTitle: '',
      bookAuthor: '',
      totalViews,
      totalPurchases: 0,
      totalLendings: 0,
      totalWishlistAdds: wishlistAdds,
      averageRating: null,
      ratingsCount: null,
      popularityScore: totalViews,
      trendingStatus: 'NORMAL',
      daysSincePublished: 0,
    }
  },
  
  getPlatformInsights: async () => ({
    totalUsers: 0, activeUsers: 0, totalBooks: 0, availableBooks: 0, totalExchanges: 0, totalLendings: 0,
    totalRevenue: 0, averageBookPrice: 0, booksByGenre: {}, booksByCategory: {}, trendingBooks: [], popularGenres: [],
    monthlyStats: { newUsers: 0, newBooks: 0, exchanges: 0, lendings: 0, revenue: 0 },
    weeklyStats: { newUsers: 0, newBooks: 0, exchanges: 0, lendings: 0, revenue: 0 },
  }),
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
  addToWishlist: async (userId: string, bookId: string, data?: AddToWishlistRequest) => {
    try {
      const { error } = await supabase.from('wishlists').insert({
        user_id: userId,
        book_id: bookId,
        notes: data?.notes ?? null,
      })
      if (error) throw error
      const items = await wishlistApi.getWishlist(userId)
      const item = items.find((i) => i.bookId === bookId)
      if (!item) throw new Error('Wishlist item not found after insert')
      return item
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  removeFromWishlist: async (userId: string, bookId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId)
      if (error) throw error
      return { message: 'Removed from wishlist' }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getWishlist: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          book_id,
          notes,
          created_at,
          books:book_id (
            id,title,author,genre,description,credit_price,status,owner_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        wishlistId: row.id,
        bookId: row.book_id,
        bookTitle: row.books?.title ?? '',
        bookAuthor: row.books?.author ?? '',
        bookGenre: row.books?.genre ?? null,
        bookDescription: row.books?.description ?? null,
        bookPrice: Number(row.books?.credit_price ?? 0),
        bookImageUrl: null,
        bookStatus: row.books?.status ?? 'AVAILABLE',
        bookOwnerId: row.books?.owner_id ?? '',
        bookOwnerName: '',
        notes: row.notes ?? null,
        addedAt: row.created_at,
      }))
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  checkInWishlist: async (userId: string, bookId: string) => {
    try {
      const { count, error } = await supabase
        .from('wishlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('book_id', bookId)
      if (error) throw error
      return { isInWishlist: (count ?? 0) > 0 }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getWishlistCount: async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('wishlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (error) throw error
      return { count: count ?? 0 }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
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
  addToBookshelf: async (userId: string, bookId: string, data?: AddToBookshelfRequest) => {
    try {
      const { error } = await supabase.from('bookshelf').insert({
        user_id: userId,
        book_id: bookId,
        notes: data?.notes ?? null,
      })
      if (error) throw error
      const list = await bookshelfApi.getBookshelf(userId)
      const item = list.find((i) => i.bookId === bookId)
      if (!item) throw new Error('Bookshelf item not found after insert')
      return item
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  removeFromBookshelf: async (userId: string, bookId: string) => {
    try {
      const { error } = await supabase
        .from('bookshelf')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId)
      if (error) throw error
      return { message: 'Removed from bookshelf' }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getBookshelf: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookshelf')
        .select(`
          id,
          book_id,
          notes,
          created_at,
          books:book_id (
            id,title,author,credit_price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: row.id,
        userId,
        bookId: row.book_id,
        bookTitle: row.books?.title ?? '',
        bookAuthor: row.books?.author ?? '',
        bookImageUrl: null,
        bookPrice: Number(row.books?.credit_price ?? 0),
        notes: row.notes ?? null,
        addedAt: row.created_at,
      }))
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  checkInBookshelf: async (userId: string, bookId: string) => {
    try {
      const { count, error } = await supabase
        .from('bookshelf')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('book_id', bookId)
      if (error) throw error
      return { isInBookshelf: (count ?? 0) > 0 }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
  
  getBookshelfCount: async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('bookshelf')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (error) throw error
      return { count: count ?? 0 }
    } catch (error) {
      throw new ApiError(asErrorMessage(error), 500, error)
    }
  },
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
  getTrustScore: async (userId: string) => {
    const { data, error } = await supabase.from('user_trust_scores').select('*').eq('user_id', userId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      userId,
      trustScore: Number(data.trust_score ?? 0),
      conditionAccuracyScore: 0,
      conditionAssessmentsCount: 0,
      accurateConditionCount: 0,
      showupReliabilityScore: Number(data.reliability_score ?? 0),
      pickupCommitmentsCount: 0,
      successfulShowupsCount: 0,
      noShowsCount: 0,
      responseTimeScore: Number(data.responsiveness_score ?? 0),
      averageResponseTimeHours: 0,
      requestsRespondedCount: 0,
      completionRate: Number(data.completion_rate ?? 0),
      totalTransactions: Number(data.events_considered ?? 0),
      completedTransactions: 0,
      cancellationRate: 0,
      cancelledTransactions: 0,
      lastCalculatedAt: data.computed_at,
    }
  },
}

export const communityApi = {
  getCircles: async () => {
    const { data: circles, error } = await supabase
      .from('community_circles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const circleIds = (circles ?? []).map((c: any) => c.id)
    const { data: members } = await supabase
      .from('community_circle_members')
      .select('circle_id')
      .in('circle_id', circleIds.length ? circleIds : ['00000000-0000-0000-0000-000000000000'])
    const { data: chains } = await supabase
      .from('community_chain_stories')
      .select('circle_id')
      .in('circle_id', circleIds.length ? circleIds : ['00000000-0000-0000-0000-000000000000'])
    const memberCount = new Map<string, number>()
    const chainCount = new Map<string, number>()
    for (const m of members ?? []) memberCount.set((m as any).circle_id, (memberCount.get((m as any).circle_id) ?? 0) + 1)
    for (const c of chains ?? []) chainCount.set((c as any).circle_id, (chainCount.get((c as any).circle_id) ?? 0) + 1)
    return (circles ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      host: 'ARKA',
      members: memberCount.get(c.id) ?? 0,
      activeChains: chainCount.get(c.id) ?? 0,
      streakDays: c.streak_days ?? 0,
      tags: [],
      badge: c.badge ?? 'reader',
    }))
  },
  
  getCircleById: async (circleId: string) => {
    const { data: circle, error } = await supabase
      .from('community_circles')
      .select('*')
      .eq('id', circleId)
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const { count: memberCount } = await supabase
      .from('community_circle_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('circle_id', circleId)
    const { count: chainCount } = await supabase
      .from('community_chain_stories')
      .select('id', { count: 'exact', head: true })
      .eq('circle_id', circleId)
    return {
      id: circle.id,
      name: circle.name,
      description: circle.description ?? '',
      host: 'ARKA',
      members: memberCount ?? 0,
      activeChains: chainCount ?? 0,
      streakDays: circle.streak_days ?? 0,
      tags: [],
      badge: circle.badge ?? 'reader',
    }
  },
  
  getCircleBooks: async (circleId: string, page?: number, size?: number) => {
    let query = supabase
      .from('community_circle_books')
      .select('book_id, books:book_id(*)')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })
    if (page !== undefined && size) {
      query = query.range(page * size, page * size + size - 1)
    }
    const { data, error } = await query
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((row: any) => mapSupabaseBook(row.books as SupabaseBookRow))
  },
  
  getChains: async () => {
    const { data: chains, error } = await supabase
      .from('community_chain_stories')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const chainIds = (chains ?? []).map((c: any) => c.id)
    const { data: participants } = await supabase
      .from('community_chain_participants')
      .select('*')
      .in('chain_id', chainIds.length ? chainIds : ['00000000-0000-0000-0000-000000000000'])
      .order('sort_order', { ascending: true })
    const participantsMap = new Map<string, any[]>()
    for (const p of participants ?? []) {
      const id = (p as any).chain_id
      if (!participantsMap.has(id)) participantsMap.set(id, [])
      participantsMap.get(id)!.push({
        name: (p as any).name,
        location: (p as any).location ?? '',
        handoff: (p as any).handoff ?? '',
      })
    }
    return (chains ?? []).map((c: any) => ({
      id: c.id,
      title: c.title,
      chainBadge: c.chain_badge ?? 'new',
      coverLabel: c.cover_label ?? '',
      streakDays: c.streak_days ?? 0,
      hops: c.hops ?? 0,
      lastHop: c.last_hop ?? '',
      participants: participantsMap.get(c.id) ?? [],
    }))
  },
  
  createChain: async (data: CreateChainRequest) => {
    const { data: inserted, error } = await supabase
      .from('community_chain_stories')
      .insert({
        title: data.title,
        book_id: data.bookId,
        chain_badge: 'new',
        cover_label: data.description ?? '',
        streak_days: 0,
        hops: 0,
        last_hop: 'Chain started',
      })
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: inserted.id,
      title: inserted.title,
      chainBadge: inserted.chain_badge ?? 'new',
      coverLabel: inserted.cover_label ?? '',
      streakDays: inserted.streak_days ?? 0,
      hops: inserted.hops ?? 0,
      lastHop: inserted.last_hop ?? '',
      participants: [],
    }
  },
  
  pingChain: async (chainId: string) => {
    const { data, error } = await supabase.rpc('ping_chain', { p_chain_id: chainId })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      chainId: data.id,
      status: 'PINGED',
      streakDays: data.streak_days ?? 0,
      lastHop: data.last_hop ?? '',
    }
  },
  
  keepChainAlive: async (chainId: string) => {
    const { data, error } = await supabase.rpc('keep_chain_alive', { p_chain_id: chainId })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      chainId: data.id,
      status: 'ALIVE',
      streakDays: data.streak_days ?? 0,
      lastHop: data.last_hop ?? '',
    }
  },
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
  create: async (userId: string, data: CreateOrderRequest) => {
    const total = data.items.reduce((sum, i) => sum + i.quantity, 0)
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ user_id: userId, total_amount: total, shipping_address: data.shippingAddress, status: 'PENDING' })
      .select('*')
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: order.id, userId: order.user_id, items: [], totalAmount: Number(order.total_amount), pickupFee: 0,
      status: order.status, shippingAddress: order.shipping_address ?? '', paymentMethod: data.paymentMethod,
      trackingNumber: order.tracking_number ?? '', createdAt: order.created_at, updatedAt: order.updated_at,
    }
  },
  
  getMyOrders: async (userId: string) => {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((o: any) => ({
      id: o.id, userId: o.user_id, items: [], totalAmount: Number(o.total_amount), pickupFee: 0, status: o.status,
      shippingAddress: o.shipping_address ?? '', paymentMethod: '', trackingNumber: o.tracking_number ?? '',
      createdAt: o.created_at, updatedAt: o.updated_at,
    }))
  },
  
  getById: async (orderId: string, _userId: string) => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return {
      id: data.id, userId: data.user_id, items: [], totalAmount: Number(data.total_amount), pickupFee: 0, status: data.status,
      shippingAddress: data.shipping_address ?? '', paymentMethod: '', trackingNumber: data.tracking_number ?? '',
      createdAt: data.created_at, updatedAt: data.updated_at,
    }
  },
  
  getTracking: async (orderId: string, _userId: string) => {
    const order = await ordersApi.getById(orderId, '')
    return { orderId, trackingNumber: order.trackingNumber, status: order.status, estimatedDelivery: '', steps: [] }
  },
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
  getById: async (id: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return { id: data.id, email: data.email, firstName: data.first_name ?? '', lastName: data.last_name ?? '', creditBalance: Number(data.credit_balance ?? 0) }
  },
  
  update: async (id: string, data: UpdateUserRequest) => {
    const { data: row, error } = await supabase.from('users').update({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select('*').single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return { id: row.id, email: row.email, firstName: row.first_name ?? '', lastName: row.last_name ?? '', creditBalance: Number(row.credit_balance ?? 0) }
  },
};

// User Behavior API functions
export const behaviorApi = {
  trackView: async (_userId: string, bookId: string, durationSeconds: number = 0) => {
    await supabase.rpc('record_user_event', {
      p_event_type: 'BOOK_VIEW',
      p_metadata: { book_id: bookId, duration_seconds: durationSeconds },
      p_idempotency_key: crypto.randomUUID(),
    })
  },
  
  trackSearch: async (_userId: string, query?: string, category?: string, subcategory?: string) => {
    await supabase.rpc('record_user_event', {
      p_event_type: 'SEARCH',
      p_metadata: { query, category, subcategory },
      p_idempotency_key: crypto.randomUUID(),
    })
  },
  
  trackCartAdd: async (_userId: string, bookId: string) => {
    await supabase.rpc('record_user_event', { p_event_type: 'CART_ADD', p_metadata: { book_id: bookId }, p_idempotency_key: crypto.randomUUID() })
  },
  
  trackCartRemove: async (_userId: string, bookId: string) => {
    await supabase.rpc('record_user_event', { p_event_type: 'CART_REMOVE', p_metadata: { book_id: bookId }, p_idempotency_key: crypto.randomUUID() })
  },
  
  trackPurchase: async (_userId: string, bookId: string) => {
    await supabase.rpc('record_user_event', { p_event_type: 'PURCHASE', p_metadata: { book_id: bookId }, p_idempotency_key: crypto.randomUUID() })
  },
  
  trackCategoryView: async (_userId: string, category?: string, subcategory?: string) => {
    await supabase.rpc('record_user_event', { p_event_type: 'CATEGORY_VIEW', p_metadata: { category, subcategory }, p_idempotency_key: crypto.randomUUID() })
  },
};









