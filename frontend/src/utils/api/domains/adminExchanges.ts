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
      const { data: created, error } = await supabase
        .from('ngos')
        .insert({
          name: data.name,
          description: data.description ?? null,
          contact_email: data.contactEmail ?? null,
          contact_phone: data.contactPhone ?? null,
          website: data.website ?? null,
          verified: !!data.verified,
        })
        .select('*')
        .single()
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

    updateNGO: async (ngoId: string, data: UpdateNGORequest): Promise<NGOResponse> => {
      const { data: updated, error } = await supabase
        .from('ngos')
        .update({
          name: data.name,
          description: data.description,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone,
          website: data.website,
          verified: data.verified,
        })
        .eq('id', ngoId)
        .select('*')
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return {
        id: updated.id,
        name: updated.name,
        description: updated.description ?? null,
        location: null,
        verified: !!updated.verified,
        booksReceived: null,
        categories: null,
        contactEmail: updated.contact_email ?? null,
        contactPhone: updated.contact_phone ?? null,
        website: updated.website ?? null,
      }
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
      return created as unknown as ExchangeResponse
    },

    getMyExchanges: async (userId?: string): Promise<ExchangeResponse[]> => {
      let query = supabase.from('exchanges').select('*').order('created_at', { ascending: false })
      if (userId) query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      const { data, error } = await query
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return (data ?? []) as unknown as ExchangeResponse[]
    },

    getBookExchanges: async (bookId: string): Promise<ExchangeResponse[]> => {
      const { data, error } = await supabase.from('exchanges').select('*').eq('book_id', bookId)
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return (data ?? []) as unknown as ExchangeResponse[]
    },

    confirm: async (exchangeId: string, _userId?: string): Promise<ExchangeResponse> => {
      const { data, error } = await supabase.rpc('update_exchange_status', {
        p_exchange_id: exchangeId,
        p_new_status: 'PENDING',
      })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return data as unknown as ExchangeResponse
    },

    complete: async (exchangeId: string, _userId?: string): Promise<ExchangeResponse> => {
      const { data, error } = await supabase.rpc('update_exchange_status', {
        p_exchange_id: exchangeId,
        p_new_status: 'COMPLETED',
      })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return data as unknown as ExchangeResponse
    },

    cancel: async (exchangeId: string, _userId?: string): Promise<ExchangeResponse> => {
      const { data, error } = await supabase.rpc('update_exchange_status', {
        p_exchange_id: exchangeId,
        p_new_status: 'CANCELLED',
      })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return data as unknown as ExchangeResponse
    },

    calculateFee: async (bookPrice: number): Promise<FeeCalculationResponse> => ({
      bookPrice,
      serviceFee: Math.round(bookPrice * 0.05 * 100) / 100,
      totalCost: Math.round(bookPrice * 1.05 * 100) / 100,
      serviceFeePercentage: '5',
    }),
  }
}
