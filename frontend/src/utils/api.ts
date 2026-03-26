import { supabase } from '../lib/supabaseClient'
import { createAdminApi, createExchangesApi } from './api/domains/adminExchanges'
import { createBehaviorApi, createCommunityApi, createOrdersApi, createUsersApi } from './api/domains/communityUserOps'
import { createDemandApi, createRecyclingApi } from './api/domains/demandRecycling'
import { createAnalyticsApi, createBookshelfApi, createTrustScoreApi, createWishlistApi } from './api/domains/insightsLibrary'

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

// NOTE: Direct backend HTTP APIs were removed. Domain operations must use Supabase.

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

// Matches `public.books` from Supabase migrations (no guessed columns).
type SupabaseBookRow = {
  id: string
  created_at: string
  updated_at: string | null
  title: string
  author: string
  description: string | null
  genre: string | null
  category: string | null
  subcategory: string | null
  credit_price: number | string
  owner_id: string | null
  status: string
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
    price: typeof row.credit_price === 'string' ? Number(row.credit_price) : Number(row.credit_price ?? 0),
    status: row.status ?? 'AVAILABLE',
    createdAt: row.created_at,
    isbn: null,
    publisher: null,
    publicationYear: null,
    // `public.books` does not store images. Images belong to listings (`book_listings.image_cover_url`)
    // or `listing_images.image_url` in the marketplace domain.
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
    const select =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'

    let query = supabase.from('books').select(select).order('created_at', { ascending: false })
    if (params?.search) query = query.ilike('title', `%${params.search}%`)
    if (params?.genre) query = query.eq('genre', params.genre)
    if (params?.subcategory) query = query.eq('subcategory', params.subcategory)
    if (params?.page !== undefined && params?.size) {
      const from = params.page * params.size
      const to = from + params.size - 1
      query = query.range(from, to)
    }

    const { data, error } = await query
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((row) => mapSupabaseBook(row as SupabaseBookRow))
  },
  
  create: async (_ownerId: string, data: { title: string; author: string; description?: string; genre?: string; price: number; imageUrl?: string }) => {
    try {
      const { data: inserted, error } = await supabase
        .from('books')
        .insert({
          // Owner is authored by the database (auth.uid()) to avoid FK mismatches.
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
    const select =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'
    const { data, error } = await supabase.from('books').select(select).eq('id', id).single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return mapSupabaseBook(data as SupabaseBookRow)
  },
  
  update: async (id: string, data: { title: string; author: string; description?: string; genre?: string; price: number; imageUrl?: string }) => {
    const select =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'
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
      .select(select)
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return mapSupabaseBook(updated as SupabaseBookRow)
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
    const select =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'
    const { data, error } = await supabase
      .from('books')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(select)
      .single()
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return mapSupabaseBook(data as SupabaseBookRow)
  },
  
  getMyBooks: async (ownerId: string) => {
    const select =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'
    const { data, error } = await supabase
      .from('books')
      .select(select)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    return (data ?? []).map((row) => mapSupabaseBook(row as SupabaseBookRow))
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

// ---------------------------------------------------------------------------
// Marketplace listing API (source of cover + condition images)
// ---------------------------------------------------------------------------

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'

export interface ListingResponse {
  listingId: string
  ownerId: string
  inventoryBookId: string
  bookId: string
  title: string
  author: string
  description: string
  genre: string | null
  category: string | null
  subcategory: string | null
  creditPrice: number
  condition: ListingCondition
  askingNotes: string | null
  tags: string[]
  coverUrl: string | null
  conditionImageUrls: string[]
  createdAt: string
}

type SupabaseBookListingRow = {
  id: string
  owner_id: string
  inventory_book_id: string
  title_override: string | null
  condition: ListingCondition
  tags: string[] | null
  image_cover_url: string | null
  asking_notes: string | null
  status: 'active' | 'paused' | 'swapped' | 'archived'
  created_at: string
}

type SupabaseInventoryBookRow = {
  id: string
  book_id: string
  condition: ListingCondition
  notes: string | null
}

type SupabaseListingImageRow = {
  id: string
  listing_id: string
  image_url: string
  sort_order: number
  created_at: string
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(n) ? n : fallback
}

export const listingsApi = {
  listActive: async (params?: { limit?: number }) => {
    const limit = Math.min(Math.max(params?.limit ?? 12, 1), 50)

    const { data: listings, error: listingsError } = await supabase
      .from('book_listings')
      .select('id,owner_id,inventory_book_id,title_override,condition,tags,image_cover_url,asking_notes,status,created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (listingsError) throw new ApiError(asErrorMessage(listingsError), 500, listingsError)

    const listingRows = (listings ?? []) as unknown as SupabaseBookListingRow[]
    if (listingRows.length === 0) return []
    const inventoryIds = listingRows.map((l) => l.inventory_book_id)

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory_books')
      .select('id,book_id,condition,notes')
      .in('id', inventoryIds)

    if (inventoryError) throw new ApiError(asErrorMessage(inventoryError), 500, inventoryError)
    const inventoryRows = (inventory ?? []) as unknown as SupabaseInventoryBookRow[]
    if (inventoryRows.length === 0) return []
    const inventoryById = new Map(inventoryRows.map((r) => [r.id, r]))

    const bookIds = Array.from(new Set(inventoryRows.map((r) => r.book_id)))
    const bookSelect =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'
    const { data: books, error: booksError } = await supabase.from('books').select(bookSelect).in('id', bookIds)
    if (booksError) throw new ApiError(asErrorMessage(booksError), 500, booksError)
    const booksById = new Map(((books ?? []) as unknown as SupabaseBookRow[]).map((b) => [b.id, b]))

    const listingIds = listingRows.map((l) => l.id)
    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('id,listing_id,image_url,sort_order,created_at')
      .in('listing_id', listingIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (imagesError) throw new ApiError(asErrorMessage(imagesError), 500, imagesError)

    const imagesByListingId = new Map<string, string[]>()
    for (const row of (images ?? []) as unknown as SupabaseListingImageRow[]) {
      const list = imagesByListingId.get(row.listing_id) ?? []
      list.push(row.image_url)
      imagesByListingId.set(row.listing_id, list)
    }

    return listingRows.map((l) => {
      const inv = inventoryById.get(l.inventory_book_id)
      if (!inv) throw new ApiError('Listing inventory link is missing', 500, { listingId: l.id })
      const book = booksById.get(inv.book_id)
      if (!book) throw new ApiError('Listing book link is missing', 500, { listingId: l.id, bookId: inv.book_id })

      const conditionImages = imagesByListingId.get(l.id) ?? []
      const coverUrl = l.image_cover_url ?? conditionImages[0] ?? null

      return {
        listingId: l.id,
        ownerId: l.owner_id,
        inventoryBookId: l.inventory_book_id,
        bookId: inv.book_id,
        title: (l.title_override && l.title_override.trim().length > 0 ? l.title_override : book.title) ?? book.title,
        author: book.author,
        description: book.description ?? '',
        genre: book.genre,
        category: book.category,
        subcategory: book.subcategory,
        creditPrice: asNumber(book.credit_price, 0),
        condition: l.condition,
        askingNotes: l.asking_notes ?? inv.notes ?? null,
        tags: Array.isArray(l.tags) ? l.tags : [],
        coverUrl,
        conditionImageUrls: conditionImages,
        createdAt: l.created_at,
      } satisfies ListingResponse
    })
  },

  getById: async (listingId: string) => {
    const { data: listing, error: listingError } = await supabase
      .from('book_listings')
      .select('id,owner_id,inventory_book_id,title_override,condition,tags,image_cover_url,asking_notes,status,created_at')
      .eq('id', listingId)
      .single()
    if (listingError) throw new ApiError(asErrorMessage(listingError), 500, listingError)
    const l = listing as unknown as SupabaseBookListingRow

    const { data: inv, error: invError } = await supabase
      .from('inventory_books')
      .select('id,book_id,condition,notes')
      .eq('id', l.inventory_book_id)
      .single()
    if (invError) throw new ApiError(asErrorMessage(invError), 500, invError)

    const bookSelect =
      'id,created_at,updated_at,title,author,description,genre,category,subcategory,credit_price,owner_id,status'
    const { data: book, error: bookError } = await supabase.from('books').select(bookSelect).eq('id', inv.book_id).single()
    if (bookError) throw new ApiError(asErrorMessage(bookError), 500, bookError)

    const { data: images, error: imagesError } = await supabase
      .from('listing_images')
      .select('id,listing_id,image_url,sort_order,created_at')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (imagesError) throw new ApiError(asErrorMessage(imagesError), 500, imagesError)

    const conditionImages = ((images ?? []) as unknown as SupabaseListingImageRow[]).map((r) => r.image_url)
    const coverUrl = l.image_cover_url ?? conditionImages[0] ?? null

    return {
      listingId: l.id,
      ownerId: l.owner_id,
      inventoryBookId: l.inventory_book_id,
      bookId: inv.book_id,
      title: (l.title_override && l.title_override.trim().length > 0 ? l.title_override : (book as any).title) ?? (book as any).title,
      author: (book as any).author,
      description: (book as any).description ?? '',
      genre: (book as any).genre ?? null,
      category: (book as any).category ?? null,
      subcategory: (book as any).subcategory ?? null,
      creditPrice: asNumber((book as any).credit_price, 0),
      condition: l.condition,
      askingNotes: l.asking_notes ?? inv.notes ?? null,
      tags: Array.isArray(l.tags) ? l.tags : [],
      coverUrl,
      conditionImageUrls: conditionImages,
      createdAt: l.created_at,
    } satisfies ListingResponse
  },
}

// File Upload API functions
export const uploadApi = {
  uploadBookImage: async (file: File) => {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
    if (!bucket) throw new ApiError('Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET', 500)
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
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
    if (!bucket) throw new ApiError('Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET', 500)
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
    const { data, error } = await supabase.rpc('cancel_donation', {
      p_donation_id: donationId,
    })
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









