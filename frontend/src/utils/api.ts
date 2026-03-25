import { supabase } from '../lib/supabaseClient'
import { createAdminApi, createExchangesApi } from './api/domains/adminExchanges'
import { createBehaviorApi, createCommunityApi, createOrdersApi, createUsersApi } from './api/domains/communityUserOps'
import { createDemandApi, createRecyclingApi } from './api/domains/demandRecycling'
import { createAnalyticsApi, createBookshelfApi, createTrustScoreApi, createWishlistApi } from './api/domains/insightsLibrary'
import { getEnv, isProd } from '../lib/env'

// Legacy backend HTTP transport (Spring) is kept as an escape hatch only.
// Primary runtime path is Supabase client + Supabase Edge Functions.
const API_BASE_URL = getEnv('NEXT_PUBLIC_API_BASE_URL') || (isProd() ? '' : 'http://localhost:8080');
const API_LATENCY_WARN_MS = Number(getEnv('NEXT_PUBLIC_API_LATENCY_WARN_MS') || 800);
const ENABLE_LEGACY_BACKEND_API = String(getEnv('NEXT_PUBLIC_ENABLE_LEGACY_BACKEND_API') || 'false') === 'true';

type ApiMetric = {
  endpoint: string;
  method: string;
  durationMs: number;
  status: number;
  ok: boolean;
};

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

function emitApiMetric(metric: ApiMetric) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:metric', { detail: metric }));
  }
  if (!metric.ok || metric.durationMs >= API_LATENCY_WARN_MS) {
    console.warn(
      `[api] ${metric.method} ${metric.endpoint} ${metric.status} ${metric.durationMs.toFixed(0)}ms`
    );
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
  // Guardrail: avoid accidental architecture drift to direct backend HTTP calls.
  if (!endpoint.startsWith('http') && !ENABLE_LEGACY_BACKEND_API) {
    throw new ApiError(
      'Legacy backend HTTP API is disabled. Use Supabase client/RPC/Edge Functions for domain operations.',
      400
    );
  }

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

  const startedAt = performance.now();
  const method = (config.method || 'GET').toUpperCase();

  try {
    const response = await fetch(url, config);
    emitApiMetric({
      endpoint,
      method,
      durationMs: performance.now() - startedAt,
      status: response.status,
      ok: response.ok,
    });
    return handleResponse<T>(response);
  } catch (error) {
    emitApiMetric({
      endpoint,
      method,
      durationMs: performance.now() - startedAt,
      status: 0,
      ok: false,
    });
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
    if (!endpoint.startsWith('http') && !ENABLE_LEGACY_BACKEND_API) {
      throw new ApiError(
        'Legacy backend HTTP upload is disabled. Use Supabase Storage upload helpers.',
        400
      );
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);
    
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
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
  image_url?: string | null
  thumbnail_url?: string | null
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
    imageUrl: row.image_url ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
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

function shouldRetryWithoutOptionalBookImageColumns(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown; status?: unknown }
  const msg = String(err.message ?? '').toLowerCase()
  const details = String(err.details ?? '').toLowerCase()
  const hint = String(err.hint ?? '').toLowerCase()
  const code = String(err.code ?? '').toUpperCase()
  const status = Number(err.status ?? NaN)

  // PostgREST "unknown column" commonly surfaces as PGRSTxxx or "column ... does not exist".
  const mentionsOptionalColumns =
    msg.includes('image_url') ||
    msg.includes('thumbnail_url') ||
    details.includes('image_url') ||
    details.includes('thumbnail_url') ||
    hint.includes('image_url') ||
    hint.includes('thumbnail_url')

  const looksLikeMissingColumn =
    msg.includes('does not exist') ||
    details.includes('does not exist') ||
    msg.includes('unknown column') ||
    details.includes('unknown column') ||
    code === 'PGRST204' ||
    code === 'PGRST200' ||
    code === '42703'

  // Some clients only surface status 400 without strong typing; we still gate on column mentions.
  const isBadRequest = status === 400

  return mentionsOptionalColumns && (looksLikeMissingColumn || isBadRequest)
}

// Book API functions
export const booksApi = {
  list: async (params?: { search?: string; genre?: string; subcategory?: string; page?: number; size?: number }) => {
    try {
      const baseSelect = 'id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id'
      const extendedSelect = `${baseSelect},image_url,thumbnail_url`

      const runQuery = async (select: string) => {
        let query = supabase.from('books').select(select).order('created_at', { ascending: false })
        if (params?.search) query = query.ilike('title', `%${params.search}%`)
        if (params?.genre) query = query.eq('genre', params.genre)
        if (params?.subcategory) query = query.eq('subcategory', params.subcategory)
        if (params?.page !== undefined && params?.size) {
          const from = params.page * params.size
          const to = from + params.size - 1
          query = query.range(from, to)
        }
        return await query
      }

      const { data: dataExt, error: errorExt } = await runQuery(extendedSelect)
      if (!errorExt) {
        const mapped = (dataExt ?? []).map((row) => mapSupabaseBook(row as unknown as SupabaseBookRow))
        return mapped
      }

      if (!shouldRetryWithoutOptionalBookImageColumns(errorExt)) throw errorExt

      // Some environments don't have image columns yet; retry with base select.
      const { data: dataBase, error: errorBase } = await runQuery(baseSelect)
      if (errorBase) throw errorBase
      const mappedBase = (dataBase ?? []).map((row) => mapSupabaseBook(row as unknown as SupabaseBookRow))
      return mappedBase
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
      const baseSelect = 'id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id'
      const extendedSelect = `${baseSelect},image_url,thumbnail_url`

      const { data: dataExt, error: errorExt } = await supabase.from('books').select(extendedSelect).eq('id', id).single()
      if (!errorExt) return mapSupabaseBook(dataExt as SupabaseBookRow)

      if (!shouldRetryWithoutOptionalBookImageColumns(errorExt)) throw errorExt

      const { data: dataBase, error: errorBase } = await supabase.from('books').select(baseSelect).eq('id', id).single()
      if (errorBase) throw errorBase
      return mapSupabaseBook(dataBase as SupabaseBookRow)
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
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id,image_url,thumbnail_url')
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
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id,image_url,thumbnail_url')
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
        .select('id,title,author,description,genre,category,subcategory,credit_price,status,created_at,owner_id,image_url,thumbnail_url')
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
  
  search: async (query: string) => booksApi.list({ search: query }),
};

// File Upload API functions
export const uploadApi = {
  uploadBookImage: async (file: File) => {
    const bucket = getEnv('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET') || 'uploads'
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const path = `book-images/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (!data?.publicUrl) throw new ApiError('Failed to generate image URL', 500)
    return { url: data.publicUrl }
  },
  
  uploadStatusImage: async (file: File) => {
    const bucket = getEnv('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET') || 'uploads'
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const path = `status-images/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (!data?.publicUrl) throw new ApiError('Failed to generate image URL', 500)
    return { url: data.publicUrl }
  },
};

// Recycling API functions
export const recyclingApi = {
  ...createRecyclingApi({ supabase, ApiError, asErrorMessage }),
}

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
  ...createAdminApi({ supabase, ApiError, asErrorMessage }, donationsApi),
}

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
  ...createDemandApi({ supabase, ApiError, asErrorMessage }),
}

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
  ...createExchangesApi({ supabase, ApiError, asErrorMessage }),
}

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
  ...createAnalyticsApi({ supabase, ApiError, asErrorMessage }),
}

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
  ...createWishlistApi({ supabase, ApiError, asErrorMessage }),
}

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
  ...createBookshelfApi({ supabase, ApiError, asErrorMessage }),
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
  ...createTrustScoreApi({ supabase, ApiError, asErrorMessage }),
}

export const communityApi = {
  ...createCommunityApi({ supabase, ApiError, asErrorMessage, mapSupabaseBook }),
}

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
  ...createOrdersApi({ supabase, ApiError, asErrorMessage }),
}

export type ShipmentPreference = 'cheapest' | 'fastest' | 'balanced' | 'manual'
export type ShipmentStatus = 'pending_manual_dispatch' | 'dispatched' | 'in_transit' | 'delivered'

export interface ShipmentResponse {
  id: string
  order_id: string
  provider_name: string | null
  preference: ShipmentPreference
  tracking_id: string | null
  status: ShipmentStatus
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreateShipmentRequest {
  order_id: string
  preference: ShipmentPreference
  provider_name?: string
  metadata?: Record<string, unknown>
}

export interface UpdateShipmentRequest {
  id: string
  provider_name?: string
  tracking_id?: string
  status?: ShipmentStatus
  metadata?: Record<string, unknown>
}

export const manualLogisticsApi = {
  createShipment: async (payload: CreateShipmentRequest) => {
    const { data, error } = await supabase.functions.invoke('create-shipment', {
      body: payload,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    if (!data?.shipment) throw new ApiError('Invalid create-shipment response', 500, data)
    return data.shipment as ShipmentResponse
  },

  updateShipment: async (payload: UpdateShipmentRequest) => {
    const { data, error } = await supabase.functions.invoke('update-shipment', {
      body: payload,
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    if (!data?.shipment) throw new ApiError('Invalid update-shipment response', 500, data)
    return data.shipment as ShipmentResponse
  },

  getShipments: async (params?: {
    status?: ShipmentStatus
    order_id?: string
    limit?: number
    offset?: number
  }) => {
    const { data, error } = await supabase.functions.invoke('get-shipments', {
      body: params ?? {},
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    if (!Array.isArray(data?.shipments)) throw new ApiError('Invalid get-shipments response', 500, data)
    return data.shipments as ShipmentResponse[]
  },

  getShipmentById: async (id: string) => {
    const { data, error } = await supabase.functions.invoke('get-shipment-by-id', {
      body: { id },
    })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    if (!data?.shipment) throw new ApiError('Invalid get-shipment-by-id response', 500, data)
    return data.shipment as ShipmentResponse
  },
}

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
  ...createUsersApi({ supabase, ApiError, asErrorMessage }),
}

// User Behavior API functions
export const behaviorApi = {
  ...createBehaviorApi({ supabase }),
}









