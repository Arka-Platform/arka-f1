import type {
  CreateExchangeRequest,
  CreateNGORequest,
  ExchangeResponse,
  FeeCalculationResponse,
  NGOResponse,
  UpdateNGORequest,
} from '../../api'

type Deps = {
  supabase: any
  ApiError: new (message: string, status: number, response?: unknown) => Error
  asErrorMessage: (error: unknown) => string
}

function mapExchangeRow(row: Record<string, unknown>): ExchangeResponse {
  const r = row as Record<string, unknown>
  const meta =
    r.metadata && typeof r.metadata === 'object' && r.metadata !== null
      ? (r.metadata as Record<string, unknown>)
      : {}
  return {
    id: String(r.id ?? ''),
    bookId: String(r.book_id ?? ''),
    bookTitle: String(r.book_title ?? meta.book_title ?? ''),
    bookAuthor: String(r.book_author ?? meta.book_author ?? ''),
    sellerId: String(r.seller_id ?? ''),
    sellerName: String(r.seller_name ?? meta.seller_name ?? ''),
    buyerId: String(r.buyer_id ?? ''),
    buyerName: String(r.buyer_name ?? meta.buyer_name ?? ''),
    amount: Number(r.gross_amount ?? 0),
    serviceFee: Number(r.platform_fee ?? 0),
    status: String(r.status ?? ''),
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? r.completed_at ?? r.created_at ?? ''),
  }
}

function mapNgoRow(n: Record<string, unknown>): NGOResponse {
  const meta =
    n.metadata && typeof n.metadata === 'object' && n.metadata !== null
      ? (n.metadata as Record<string, unknown>)
      : {}
  const cats = meta.categories
  return {
    id: String(n.id ?? ''),
    name: String(n.name ?? ''),
    description: (n.description as string | null | undefined) ?? null,
    location: typeof meta.location === 'string' ? meta.location : null,
    verified: !!n.verified,
    booksReceived: null,
    categories: Array.isArray(cats) ? cats.filter((x): x is string => typeof x === 'string') : null,
    contactEmail: (n.contact_email as string | null | undefined) ?? null,
    contactPhone: (n.contact_phone as string | null | undefined) ?? null,
    website: (n.website as string | null | undefined) ?? null,
  }
}

export function createAdminApi(
  { supabase, ApiError, asErrorMessage }: Deps,
  donationsApi: { getNGOs: () => Promise<NGOResponse[]> }
) {
  const adminApi = {
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

    createNGO: async (data: CreateNGORequest): Promise<NGOResponse> => {
      const metadata: Record<string, unknown> = {}
      if (data.location) metadata.location = data.location
      if (data.categories?.length) metadata.categories = data.categories
      const { data: row, error } = await supabase
        .from('ngos')
        .insert({
          name: data.name.trim(),
          description: data.description ?? null,
          verified: data.verified ?? false,
          contact_email: data.contactEmail ?? null,
          contact_phone: data.contactPhone ?? null,
          website: data.website ?? null,
          metadata,
        })
        .select('*')
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return mapNgoRow(row as Record<string, unknown>)
    },

    updateNGO: async (ngoId: string, data: UpdateNGORequest): Promise<NGOResponse> => {
      const { data: existing, error: fetchErr } = await supabase.from('ngos').select('*').eq('id', ngoId).single()
      if (fetchErr) throw new ApiError(asErrorMessage(fetchErr), 500, fetchErr)
      const ex = existing as Record<string, unknown>
      const prevMeta =
        ex.metadata && typeof ex.metadata === 'object' && ex.metadata !== null
          ? { ...(ex.metadata as Record<string, unknown>) }
          : {}
      if (data.location !== undefined) prevMeta.location = data.location
      if (data.categories !== undefined) prevMeta.categories = data.categories

      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        metadata: prevMeta,
      }
      if (data.name !== undefined) patch.name = data.name.trim()
      if (data.description !== undefined) patch.description = data.description
      if (data.contactEmail !== undefined) patch.contact_email = data.contactEmail
      if (data.contactPhone !== undefined) patch.contact_phone = data.contactPhone
      if (data.website !== undefined) patch.website = data.website
      if (data.verified !== undefined) patch.verified = data.verified

      const { data: row, error } = await supabase.from('ngos').update(patch).eq('id', ngoId).select('*').single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return mapNgoRow(row as Record<string, unknown>)
    },

    deleteNGO: async (ngoId: string) => {
      const { error } = await supabase.from('ngos').delete().eq('id', ngoId)
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
    },

    verifyNGO: async (ngoId: string) => adminApi.updateNGO(ngoId, { verified: true }),
  }

  return adminApi
}

export function createExchangesApi({ supabase, ApiError, asErrorMessage }: Deps) {
  return {
    create: async (data: CreateExchangeRequest, buyerId?: string): Promise<ExchangeResponse> => {
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
      return mapExchangeRow(created as Record<string, unknown>)
    },

    getMyExchanges: async (userId?: string): Promise<ExchangeResponse[]> => {
      let query = supabase.from('exchanges').select('*').order('created_at', { ascending: false })
      if (userId) query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      const { data, error } = await query
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return (data ?? []).map((row: Record<string, unknown>) => mapExchangeRow(row))
    },

    getBookExchanges: async (bookId: string): Promise<ExchangeResponse[]> => {
      const { data, error } = await supabase.from('exchanges').select('*').eq('book_id', bookId)
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return (data ?? []).map((row: Record<string, unknown>) => mapExchangeRow(row))
    },

    confirm: async (exchangeId: string, _userId?: string): Promise<ExchangeResponse> => {
      const { data, error } = await supabase.rpc('update_exchange_status', {
        p_exchange_id: exchangeId,
        p_new_status: 'COMPLETED',
      })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return mapExchangeRow(data as Record<string, unknown>)
    },

    complete: async (exchangeId: string, _userId?: string): Promise<ExchangeResponse> => {
      const { data, error } = await supabase.rpc('update_exchange_status', {
        p_exchange_id: exchangeId,
        p_new_status: 'COMPLETED',
      })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return mapExchangeRow(data as Record<string, unknown>)
    },

    cancel: async (exchangeId: string, _userId?: string): Promise<ExchangeResponse> => {
      const { data, error } = await supabase.rpc('update_exchange_status', {
        p_exchange_id: exchangeId,
        p_new_status: 'CANCELLED',
      })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return mapExchangeRow(data as Record<string, unknown>)
    },

    calculateFee: async (bookPrice: number): Promise<FeeCalculationResponse> => ({
      bookPrice,
      serviceFee: Math.round(bookPrice * 0.05 * 100) / 100,
      totalCost: Math.round(bookPrice * 1.05 * 100) / 100,
      serviceFeePercentage: '5',
    }),
  }
}
