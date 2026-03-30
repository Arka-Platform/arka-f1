import type {
  ChainActionResponse,
  CommunityCircleResponse,
  CreateChainRequest,
  CreateCommunityCircleRequest,
  CreateOrderRequest,
  OrderResponse,
  OrderTrackingResponse,
  UserResponse,
  UpdateUserRequest,
  BookResponse,
  ChainStoryResponse,
} from '../../api'
import {
  CIRCLE_BADGE_MAX_LENGTH,
  CIRCLE_DESCRIPTION_MAX_LENGTH,
  CIRCLE_NAME_MAX_LENGTH,
  DEFAULT_CIRCLE_BADGE,
  DEFAULT_COMMUNITY_CIRCLE_HOST_LABEL,
} from '../../communityCircleConstants'

type Deps = {
  supabase: any
  ApiError: new (message: string, status: number, response?: unknown) => Error
  asErrorMessage: (error: unknown) => string
  mapSupabaseBook: (row: any) => BookResponse
}

type CommunityCircleRow = {
  id: string
  name: string
  description?: string | null
  streak_days?: number | null
  badge?: string | null
  host_display_name?: string | null
}

function hostLabelFromCircleRow(row: { host_display_name?: string | null }): string {
  const v = typeof row.host_display_name === 'string' ? row.host_display_name.trim() : ''
  return v.length > 0 ? v : DEFAULT_COMMUNITY_CIRCLE_HOST_LABEL
}

function mapRowToCommunityCircleResponse(
  row: CommunityCircleRow,
  memberCount: number,
  chainCount: number
): CommunityCircleResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    host: hostLabelFromCircleRow(row),
    members: memberCount,
    activeChains: chainCount,
    streakDays: row.streak_days ?? 0,
    tags: [],
    badge: row.badge ?? DEFAULT_CIRCLE_BADGE,
  }
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
      return (circles ?? []).map((c: CommunityCircleRow) =>
        mapRowToCommunityCircleResponse(c, memberCount.get(c.id) ?? 0, chainCount.get(c.id) ?? 0)
      )
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
      return mapRowToCommunityCircleResponse(circle as CommunityCircleRow, memberCount ?? 0, chainCount ?? 0)
    },

    createCircle: async (userId: string, input: CreateCommunityCircleRequest): Promise<CommunityCircleResponse> => {
      if (!userId) throw new ApiError('Sign in to create a reading circle.', 401)
      const name = input.name.trim()
      if (!name) throw new ApiError('Circle name is required.', 400)
      if (name.length > CIRCLE_NAME_MAX_LENGTH) throw new ApiError('Circle name is too long.', 400)
      const description = (input.description ?? '').trim()
      if (description.length > CIRCLE_DESCRIPTION_MAX_LENGTH) throw new ApiError('Description is too long.', 400)

      let hostDisplay = (input.hostDisplayName ?? '').trim()
      if (!hostDisplay) {
        const { data: profile } = await supabase.from('users').select('first_name,last_name').eq('id', userId).maybeSingle()
        const fn = (profile?.first_name ?? '').trim()
        const ln = (profile?.last_name ?? '').trim()
        hostDisplay = [fn, ln].filter(Boolean).join(' ')
      }
      if (!hostDisplay) hostDisplay = DEFAULT_COMMUNITY_CIRCLE_HOST_LABEL

      const badgeRaw = (input.badge ?? DEFAULT_CIRCLE_BADGE).trim().toLowerCase() || DEFAULT_CIRCLE_BADGE
      const badge = badgeRaw.length > CIRCLE_BADGE_MAX_LENGTH ? badgeRaw.slice(0, CIRCLE_BADGE_MAX_LENGTH) : badgeRaw

      const { data: row, error } = await supabase
        .from('community_circles')
        .insert({
          name,
          description,
          host_user_id: userId,
          host_display_name: hostDisplay,
          badge,
        })
        .select('*')
        .single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)

      const { error: memErr } = await supabase.from('community_circle_members').insert({
        circle_id: row.id,
        user_id: userId,
      })
      if (memErr) {
        await supabase.from('community_circles').delete().eq('id', row.id)
        throw new ApiError(asErrorMessage(memErr), 500, memErr)
      }

      const { count: memberCount } = await supabase
        .from('community_circle_members')
        .select('id', { count: 'exact', head: true })
        .eq('circle_id', row.id)
      const { count: chainCount } = await supabase
        .from('community_chain_stories')
        .select('id', { count: 'exact', head: true })
        .eq('circle_id', row.id)

      return mapRowToCommunityCircleResponse(row as CommunityCircleRow, memberCount ?? 0, chainCount ?? 0)
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

  type OrderItemJoinRow = {
    id: string
    order_id: string
    book_id: string
    quantity: number
    unit_price: number
    books?: { title?: string | null; author?: string | null } | null
  }

  const fetchItemsForOrders = async (orderIds: string[]) => {
    if (orderIds.length === 0) return new Map<string, OrderResponse['items']>()
    const { data, error } = await supabase
      .from('order_items')
      .select('id, order_id, book_id, quantity, unit_price, books:book_id (title, author)')
      .in('order_id', orderIds)
    if (error) throw new ApiError(asErrorMessage(error), 500, error)
    const map = new Map<string, OrderResponse['items']>()
    for (const row of (data ?? []) as OrderItemJoinRow[]) {
      const list = map.get(row.order_id) ?? []
      const qty = Number(row.quantity ?? 0)
      const unit = Number(row.unit_price ?? 0)
      list.push({
        id: row.id,
        bookId: row.book_id,
        bookTitle: row.books?.title ?? '',
        bookAuthor: row.books?.author ?? '',
        quantity: qty,
        unitPrice: unit,
        subtotal: qty * unit,
      })
      map.set(row.order_id, list)
    }
    return map
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
      const rows = data ?? []
      const ids = rows.map((o: any) => o.id as string)
      const itemsByOrder = await fetchItemsForOrders(ids)
      return rows.map((o: any) => ({
        id: o.id,
        userId: o.user_id,
        items: itemsByOrder.get(o.id) ?? [],
        totalAmount: Number(o.total_amount),
        pickupFee: 0,
        status: o.status,
        shippingAddress: o.shipping_address ?? '',
        paymentMethod: '',
        trackingNumber: o.tracking_number ?? '',
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      }))
    },

    getById: async (orderId: string, userId: string): Promise<OrderResponse> => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      if (userId && data.user_id !== userId) {
        throw new ApiError('Order not found', 404, error)
      }
      const itemsByOrder = await fetchItemsForOrders([orderId])
      return {
        id: data.id,
        userId: data.user_id,
        items: itemsByOrder.get(orderId) ?? [],
        totalAmount: Number(data.total_amount),
        pickupFee: 0,
        status: data.status,
        shippingAddress: data.shipping_address ?? '',
        paymentMethod: '',
        trackingNumber: data.tracking_number ?? '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    },

    getTracking: async (orderId: string, userId: string): Promise<OrderTrackingResponse> => {
      const order = await ordersApi.getById(orderId, userId)
      const { data: shipRows } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
      const ship = shipRows?.[0] as
        | { status?: string; tracking_id?: string | null; provider_name?: string | null; updated_at?: string }
        | undefined

      const shipStatus = ship?.status
      const trackingLabel = (ship?.tracking_id || order.trackingNumber || orderId).toString()

      const steps: OrderTrackingResponse['steps'] = [
        { id: '1', title: 'Order placed', description: 'We received your order.', date: order.createdAt, completed: true },
        {
          id: '2',
          title: 'Processing',
          description: 'Preparing for dispatch.',
          completed: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        },
        {
          id: '3',
          title: 'Shipped',
          description: ship?.provider_name ? `Carrier: ${ship.provider_name}` : 'Awaiting carrier details.',
          completed: ['SHIPPED', 'DELIVERED'].includes(order.status) || shipStatus === 'dispatched' || shipStatus === 'in_transit' || shipStatus === 'delivered',
        },
        {
          id: '4',
          title: 'Delivered',
          description: 'Package delivered.',
          completed: order.status === 'DELIVERED' || shipStatus === 'delivered',
        },
      ]

      return {
        orderId,
        trackingNumber: trackingLabel,
        status: shipStatus || order.status,
        estimatedDelivery: '',
        steps,
      }
    },
  }
  return ordersApi
}

export function createUsersApi({ supabase, ApiError, asErrorMessage }: Omit<Deps, 'mapSupabaseBook'>) {
  return {
    getParticipationCounts: async (userId: string): Promise<{ offerCount: number; takeCount: number }> => {
      const { data, error } = await supabase
        .from('users')
        .select('offer_count, take_count')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      if (!data) return { offerCount: 0, takeCount: 0 }
      const row = data as { offer_count?: number | null; take_count?: number | null }
      return {
        offerCount: Math.max(0, Number(row.offer_count ?? 0)),
        takeCount: Math.max(0, Number(row.take_count ?? 0)),
      }
    },

    getById: async (id: string): Promise<UserResponse> => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const settings =
        data.account_settings && typeof data.account_settings === 'object' && !Array.isArray(data.account_settings)
          ? (data.account_settings as Record<string, unknown>)
          : null
      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name ?? '',
        lastName: data.last_name ?? '',
        accountSettings: settings,
      }
    },

    update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (data.firstName !== undefined) patch.first_name = data.firstName
      if (data.lastName !== undefined) patch.last_name = data.lastName
      if (data.email !== undefined) patch.email = data.email

      if (data.accountSettings !== undefined) {
        const { data: cur, error: curErr } = await supabase.from('users').select('account_settings').eq('id', id).single()
        if (curErr) throw new ApiError(asErrorMessage(curErr), 500, curErr)
        const base =
          cur?.account_settings && typeof cur.account_settings === 'object' && !Array.isArray(cur.account_settings)
            ? { ...(cur.account_settings as Record<string, unknown>) }
            : {}
        patch.account_settings = { ...base, ...data.accountSettings }
      }

      const { data: row, error } = await supabase.from('users').update(patch).eq('id', id).select('*').single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const settings =
        row.account_settings && typeof row.account_settings === 'object' && !Array.isArray(row.account_settings)
          ? (row.account_settings as Record<string, unknown>)
          : null
      return {
        id: row.id,
        email: row.email,
        firstName: row.first_name ?? '',
        lastName: row.last_name ?? '',
        accountSettings: settings,
      }
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
