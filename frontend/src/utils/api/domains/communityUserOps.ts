import type {
  ChainActionResponse,
  CommunityCircleResponse,
  CreateChainRequest,
  CreateOrderRequest,
  OrderResponse,
  OrderTrackingResponse,
  UserResponse,
  UpdateUserRequest,
  BookResponse,
  ChainStoryResponse,
} from '../../api'

type Deps = {
  supabase: any
  ApiError: new (message: string, status: number, response?: unknown) => Error
  asErrorMessage: (error: unknown) => string
  mapSupabaseBook: (row: any) => BookResponse
}

export function createCommunityApi({ supabase, ApiError, asErrorMessage, mapSupabaseBook }: Deps) {
  return {
    getCircles: async (): Promise<CommunityCircleResponse[]> => {
      const { data: circles, error } = await supabase
        .from('community_circles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const circleIds = (circles ?? []).map((c: any) => c.id)
      let members: any[] | null = null
      let chains: any[] | null = null
      if (circleIds.length) {
        const { data: membersData } = await supabase
          .from('community_circle_members')
          .select('circle_id')
          .in('circle_id', circleIds)
        const { data: chainsData } = await supabase
          .from('community_chain_stories')
          .select('circle_id')
          .in('circle_id', circleIds)
        members = membersData ?? []
        chains = chainsData ?? []
      }
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

    getCircleById: async (circleId: string): Promise<CommunityCircleResponse> => {
      const { data: circle, error } = await supabase
        .from('community_circles')
        .select('*')
        .eq('id', circleId)
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const { count: memberCount } = await supabase
        .from('community_circle_members')
        .select('id', { count: 'exact', head: true })
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

    getCircleBooks: async (circleId: string, page?: number, size?: number): Promise<BookResponse[]> => {
      let query = supabase
        .from('community_circle_books')
        .select('book_id, books:book_id(*)')
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false })
      if (page !== undefined && size) query = query.range(page * size, page * size + size - 1)
      const { data, error } = await query
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return (data ?? []).map((row: any) => mapSupabaseBook(row.books))
    },

    getChains: async (): Promise<ChainStoryResponse[]> => {
      const { data: chains, error } = await supabase
        .from('community_chain_stories')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const chainIds = (chains ?? []).map((c: any) => c.id)
      let participants: any[] | null = null
      if (chainIds.length) {
        const { data: participantsData } = await supabase
          .from('community_chain_participants')
          .select('*')
          .in('chain_id', chainIds)
          .order('sort_order', { ascending: true })
        participants = participantsData ?? []
      }
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

    createChain: async (data: CreateChainRequest): Promise<ChainStoryResponse> => {
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

    pingChain: async (chainId: string): Promise<ChainActionResponse> => {
      const { data, error } = await supabase.rpc('ping_chain', { p_chain_id: chainId })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return {
        chainId: data.id,
        status: 'PINGED',
        streakDays: data.streak_days ?? 0,
        lastHop: data.last_hop ?? '',
      }
    },

    keepChainAlive: async (chainId: string): Promise<ChainActionResponse> => {
      const { data, error } = await supabase.rpc('keep_chain_alive', { p_chain_id: chainId })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return {
        chainId: data.id,
        status: 'ALIVE',
        streakDays: data.streak_days ?? 0,
        lastHop: data.last_hop ?? '',
      }
    },
  }
}

export function createOrdersApi({ supabase, ApiError, asErrorMessage }: Omit<Deps, 'mapSupabaseBook'>) {
  type OrderBookRow = {
    id: string
    credit_price: number | null
    title: string | null
    author: string | null
  }

  type NormalizedOrderItem = {
    bookId: string
    quantity: number
    unitPrice: number
    title: string
    author: string
  }

  type InsertedOrderItemRow = {
    id: string
    book_id: string
    quantity: number
    unit_price: number
  }

  const ordersApi = {
    create: async (userId: string, data: CreateOrderRequest): Promise<OrderResponse> => {
      if (!data.items.length) {
        throw new ApiError('Order must contain at least one item', 400)
      }

      const bookIds = data.items.map((item) => item.bookId)
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id,credit_price,title,author')
        .in('id', bookIds)
      if (booksError) throw new ApiError(asErrorMessage(booksError), 500, booksError)

      const byId = new Map<string, OrderBookRow>((books ?? []).map((b: OrderBookRow) => [b.id, b]))
      const missing = bookIds.filter((id) => !byId.has(id))
      if (missing.length) {
        throw new ApiError('One or more selected books were not found', 400, { missing })
      }

      const normalizedItems: NormalizedOrderItem[] = data.items.map((item) => {
        const book = byId.get(item.bookId)
        const unitPrice = Number(book?.credit_price ?? 0)
        return {
          bookId: item.bookId,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
          title: String(book?.title ?? ''),
          author: String(book?.author ?? ''),
        }
      })
      const total = normalizedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

      const { data: order, error } = await supabase
        .from('orders')
        .insert({ user_id: userId, total_amount: total, shipping_address: data.shippingAddress, status: 'PENDING' })
        .select('*')
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(
          normalizedItems.map((item) => ({
            order_id: order.id,
            book_id: item.bookId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
          }))
        )
        .select('id,book_id,quantity,unit_price')
      if (itemsError) throw new ApiError(asErrorMessage(itemsError), 500, itemsError)

      const normalizedByBookId = new Map<string, NormalizedOrderItem>(
        normalizedItems.map((i) => [i.bookId, i])
      )
      const itemResponses = (insertedItems as InsertedOrderItemRow[] | null ?? []).map((row) => {
        const meta = normalizedByBookId.get(row.book_id)
        const unitPrice = Number(row.unit_price ?? 0)
        const quantity = Number(row.quantity ?? 0)
        return {
          id: row.id,
          bookId: row.book_id,
          bookTitle: meta?.title ?? '',
          bookAuthor: meta?.author ?? '',
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
        }
      })

      return {
        id: order.id, userId: order.user_id, items: itemResponses, totalAmount: Number(order.total_amount), pickupFee: 0,
        status: order.status, shippingAddress: order.shipping_address ?? '', paymentMethod: data.paymentMethod,
        trackingNumber: order.tracking_number ?? '', createdAt: order.created_at, updatedAt: order.updated_at,
      }
    },

    getMyOrders: async (userId: string): Promise<OrderResponse[]> => {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return (data ?? []).map((o: any) => ({
        id: o.id, userId: o.user_id, items: [], totalAmount: Number(o.total_amount), pickupFee: 0, status: o.status,
        shippingAddress: o.shipping_address ?? '', paymentMethod: '', trackingNumber: o.tracking_number ?? '',
        createdAt: o.created_at, updatedAt: o.updated_at,
      }))
    },

    getById: async (orderId: string, _userId: string): Promise<OrderResponse> => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return {
        id: data.id, userId: data.user_id, items: [], totalAmount: Number(data.total_amount), pickupFee: 0, status: data.status,
        shippingAddress: data.shipping_address ?? '', paymentMethod: '', trackingNumber: data.tracking_number ?? '',
        createdAt: data.created_at, updatedAt: data.updated_at,
      }
    },

    getTracking: async (orderId: string, _userId: string): Promise<OrderTrackingResponse> => {
      const order = await ordersApi.getById(orderId, '')
      return { orderId, trackingNumber: order.trackingNumber, status: order.status, estimatedDelivery: '', steps: [] }
    },
  }
  return ordersApi
}

export function createUsersApi({ supabase, ApiError, asErrorMessage }: Omit<Deps, 'mapSupabaseBook'>) {
  return {
    getById: async (id: string): Promise<UserResponse> => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return { id: data.id, email: data.email, firstName: data.first_name ?? '', lastName: data.last_name ?? '', creditBalance: Number(data.credit_balance ?? 0) }
    },

    update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
      const { data: row, error } = await supabase
        .from('users')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return { id: row.id, email: row.email, firstName: row.first_name ?? '', lastName: row.last_name ?? '', creditBalance: Number(row.credit_balance ?? 0) }
    },
  }
}

export function createBehaviorApi({ supabase }: Omit<Deps, 'mapSupabaseBook' | 'ApiError' | 'asErrorMessage'>) {
  return {
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
  }
}
