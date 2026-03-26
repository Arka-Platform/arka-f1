import type {
  AutoFillSuggestions,
  BookRequestResponse,
  CreateBookRequestRequest,
  CreateRequestResponse,
  FulfillRequestRequest,
  MatchResponse,
  RequestMatchResponse,
  WastePaperResponse,
} from '../../api'

type Deps = {
  supabase: any
  ApiError: new (message: string, status: number, response?: unknown) => Error
  asErrorMessage: (error: unknown) => string
}

export function createRecyclingApi({ supabase, ApiError, asErrorMessage }: Deps) {
  return {
    list: async (params?: { search?: string; category?: string }): Promise<WastePaperResponse[]> => {
      let query = supabase
        .from('waste_paper')
        .select('*')
        .order('created_at', { ascending: false })

      if (params?.category) query = query.eq('category', params.category)
      if (params?.search) {
        const q = params.search.trim()
        if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
      }

      const { data, error } = await query
      if (error) {
        if (String(error.message).toLowerCase().includes('relation') && String(error.message).toLowerCase().includes('does not exist')) {
          throw new ApiError('Recycling domain is not deployed in Supabase yet. Please run recycling migration.', 500, error)
        }
        throw new ApiError(asErrorMessage(error), 500, error)
      }

      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title ?? 'Untitled Item',
        description: row.description ?? '',
        category: row.category ?? null,
        weightKg: Number(row.weight_kg ?? row.weightKg ?? 0),
        creditValue: Number(row.credit_value ?? row.creditValue ?? 0),
        status: row.status ?? 'AVAILABLE',
        createdAt: row.created_at ?? new Date().toISOString(),
      }))
    },
  }
}

export function createDemandApi({ supabase, ApiError, asErrorMessage }: Deps) {
  const requestSelect = 'id,user_id,book_id,status,notes,matching_metadata,created_at,updated_at,cancelled_at'

  const mapRequestRow = (row: any, book: any, requester: any): BookRequestResponse => {
    return {
      id: row.id,
      requesterId: row.user_id ?? '',
      requesterName: `${requester.first_name ?? ''} ${requester.last_name ?? ''}`.trim() || 'Reader',
      requesterEmail: requester.email ?? null,
      title: book.title ?? 'Unknown title',
      author: book.author ?? 'Unknown author',
      description: row.notes ?? null,
      genre: book.genre ?? null,
      category: book.category ?? null,
      subcategory: book.subcategory ?? null,
      isbn: null,
      maxPrice: null,
      preferredCondition: null,
      urgency: null,
      location: null,
      additionalNotes: row.notes ?? null,
      status: row.status ?? 'OPEN',
      expiresAt: null,
      fulfilledBy: null,
      fulfilledByName: null,
      fulfilledAt: row.status === 'FULFILLED' ? row.updated_at ?? null : null,
      viewsCount: 0,
      offersCount: 0,
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    }
  }

  const hydrateRequests = async (rows: any[]): Promise<BookRequestResponse[]> => {
    const bookIds = Array.from(new Set((rows ?? []).map((row: any) => row.book_id).filter(Boolean)))
    const userIds = Array.from(new Set((rows ?? []).map((row: any) => row.user_id).filter(Boolean)))

    const [booksResult, usersResult] = await Promise.all([
      bookIds.length > 0
        ? supabase.from('books').select('id,title,author,genre,category,subcategory').in('id', bookIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length > 0
        ? supabase.from('users').select('id,email,first_name,last_name').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (booksResult.error) throw new ApiError(asErrorMessage(booksResult.error), 500, booksResult.error)
    if (usersResult.error) throw new ApiError(asErrorMessage(usersResult.error), 500, usersResult.error)

    const booksById = new Map((booksResult.data ?? []).map((book: any) => [book.id, book]))
    const usersById = new Map((usersResult.data ?? []).map((user: any) => [user.id, user]))

    return (rows ?? []).map((row: any) => mapRequestRow(row, booksById.get(row.book_id) ?? {}, usersById.get(row.user_id) ?? {}))
  }

  const demandApi = {
    createRequest: async (_requesterId: string, data: CreateBookRequestRequest): Promise<CreateRequestResponse> => {
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
      const [request] = await hydrateRequests([req])
      return { request, matches: [], totalMatches: 0 }
    },

    getOpenRequests: async (): Promise<BookRequestResponse[]> => {
      const { data, error } = await supabase.from('v_open_book_requests').select(requestSelect).order('created_at', { ascending: false })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return hydrateRequests(data ?? [])
    },

    getMyRequests: async (userId: string): Promise<BookRequestResponse[]> => {
      const { data, error } = await supabase
        .from('book_requests')
        .select(requestSelect)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return hydrateRequests(data ?? [])
    },

    getRequest: async (requestId: string): Promise<BookRequestResponse> => {
      const { data, error } = await supabase.from('book_requests').select(requestSelect).eq('id', requestId).single()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const [request] = await hydrateRequests([data])
      return request
    },

    searchRequests: async (query: string): Promise<BookRequestResponse[]> => {
      const q = query.trim()
      if (!q) return demandApi.getOpenRequests()
      const { data, error } = await supabase
        .from('v_open_book_requests')
        .select(requestSelect)
        .order('created_at', { ascending: false })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const rows = await hydrateRequests(data ?? [])
      const needle = q.toLowerCase()
      return rows.filter((row: BookRequestResponse) =>
        [row.title, row.author, row.genre, row.category].filter(Boolean).join(' ').toLowerCase().includes(needle)
      )
    },

    fulfillRequest: async (requestId: string, _sellerId: string, data: FulfillRequestRequest): Promise<BookRequestResponse> => {
      const { data: requestRow, error: requestError } = await supabase
        .from('book_requests')
        .select('id')
        .eq('id', requestId)
        .single()
      if (requestError) throw new ApiError(asErrorMessage(requestError), 500, requestError)

      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('owner_id')
        .eq('id', data.bookId)
        .single()
      if (bookError) throw new ApiError(asErrorMessage(bookError), 500, bookError)
      if (!book.owner_id) throw new ApiError('Book owner missing', 400)

      const { error: exchangeError } = await supabase.rpc('perform_exchange', {
        p_seller_id: book.owner_id,
        p_book_id: data.bookId,
        p_request_id: requestRow.id,
        p_gross_amount: Number(data.offeredPrice ?? 1),
        p_platform_fee: 0,
        p_idempotency_key: crypto.randomUUID(),
      })
      if (exchangeError) throw new ApiError(asErrorMessage(exchangeError), 500, exchangeError)

      return demandApi.getRequest(requestId)
    },

    cancelRequest: async (requestId: string, _userId: string): Promise<BookRequestResponse> => {
      const { data, error } = await supabase.rpc('cancel_request', { p_request_id: requestId })
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      return data as unknown as BookRequestResponse
    },

    getMatchesForRequest: async (requestId: string, requesterId?: string): Promise<MatchResponse[]> => {
      const { data: req, error: reqError } = await supabase
        .from('book_requests')
        .select('*')
        .eq('id', requestId)
        .single()
      if (reqError) throw new ApiError(asErrorMessage(reqError), 500, reqError)

      const { data: reqBook, error: reqBookError } = await supabase
        .from('books')
        .select('id,title,author,genre,category')
        .eq('id', req.book_id)
        .maybeSingle()
      if (reqBookError) throw new ApiError(asErrorMessage(reqBookError), 500, reqBookError)

      let booksQuery = supabase
        .from('books')
        .select('id,title,author,genre,category,credit_price,owner_id,status')
        .eq('status', 'AVAILABLE')
        .limit(50)

      const requestBook = reqBook ?? null
      if (requestBook?.title) booksQuery = booksQuery.ilike('title', `%${requestBook.title}%`)
      if (requestBook?.author) booksQuery = booksQuery.ilike('author', `%${requestBook.author}%`)
      if (requestBook?.genre) booksQuery = booksQuery.eq('genre', requestBook.genre)
      if (requestBook?.category) booksQuery = booksQuery.eq('category', requestBook.category)
      if (requesterId) booksQuery = booksQuery.neq('owner_id', requesterId)

      const { data: books, error: booksError } = await booksQuery
      if (booksError) throw new ApiError(asErrorMessage(booksError), 500, booksError)

      const ownerIds = Array.from(new Set((books ?? []).map((b: any) => b.owner_id).filter(Boolean)))
      const usersMap = new Map<string, { first_name: string | null; last_name: string | null }>()
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from('users')
          .select('id,first_name,last_name')
          .in('id', ownerIds)
        ;(owners ?? []).forEach((u: any) => usersMap.set(u.id, { first_name: u.first_name ?? null, last_name: u.last_name ?? null }))
      }

      const matches = (books ?? []).map((b: any) => {
        let score = 60
        const reasons: string[] = []
        if (requestBook?.title && String(b.title).toLowerCase() === String(requestBook.title).toLowerCase()) {
          score += 20
          reasons.push('Exact title match')
        }
        if (requestBook?.author && String(b.author).toLowerCase() === String(requestBook.author).toLowerCase()) {
          score += 15
          reasons.push('Exact author match')
        }
        if (requestBook?.genre && b.genre && String(requestBook.genre).toLowerCase() === String(b.genre).toLowerCase()) {
          score += 5
          reasons.push('Same genre')
        }
        const owner = usersMap.get(b.owner_id)
        return {
          bookId: b.id,
          bookTitle: b.title,
          bookAuthor: b.author,
          bookGenre: b.genre ?? null,
          bookPrice: Number(b.credit_price ?? 0),
          bookImageUrl: null,
          sellerId: b.owner_id ?? '',
          sellerName: owner ? `${owner.first_name ?? ''} ${owner.last_name ?? ''}`.trim() || 'Seller' : 'Seller',
          matchScore: Math.min(score, 100),
          matchReasons: reasons.length > 0 ? reasons : ['Similar request'],
        } as MatchResponse
      })

      return matches.sort((a: MatchResponse, b: MatchResponse) => b.matchScore - a.matchScore).slice(0, 10)
    },

    getMatchesForBook: async (bookId: string, sellerId?: string): Promise<RequestMatchResponse[]> => {
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()
      if (bookError) throw new ApiError(asErrorMessage(bookError), 500, bookError)

      let reqQuery = supabase
        .from('v_open_book_requests')
        .select(requestSelect)
        .limit(50)

      reqQuery = reqQuery.or(`notes.ilike.%${book.title}%,notes.ilike.%${book.author}%`)
      if (sellerId) reqQuery = reqQuery.neq('user_id', sellerId)
      const { data: requests, error: reqError } = await reqQuery
      if (reqError) throw new ApiError(asErrorMessage(reqError), 500, reqError)
      const hydratedRequests = await hydrateRequests(requests ?? [])

      const matches = hydratedRequests.map((r: BookRequestResponse) => {
        let score = 60
        const reasons: string[] = []
        if (String(r.title ?? '').toLowerCase() === String(book.title ?? '').toLowerCase()) {
          score += 20
          reasons.push('Exact title match')
        }
        if (String(r.author ?? '').toLowerCase() === String(book.author ?? '').toLowerCase()) {
          score += 15
          reasons.push('Exact author match')
        }
        if (r.genre && book.genre && String(r.genre).toLowerCase() === String(book.genre).toLowerCase()) {
          score += 5
          reasons.push('Same genre')
        }
        return {
          requestId: r.id,
          requestTitle: r.title ?? 'Unknown title',
          requestAuthor: r.author ?? 'Unknown author',
          requestGenre: r.genre ?? null,
          maxPrice: r.maxPrice ?? null,
          urgency: r.urgency ?? null,
          location: r.location ?? null,
          viewsCount: Number(r.viewsCount ?? 0),
          matchScore: Math.min(score, 100),
          matchReasons: reasons.length > 0 ? reasons : ['Similar request'],
        } as RequestMatchResponse
      })

      return matches.sort((a: RequestMatchResponse, b: RequestMatchResponse) => b.matchScore - a.matchScore).slice(0, 10)
    },

    getAutoFillSuggestions: async (userId?: string): Promise<AutoFillSuggestions> => {
      if (!userId) return { recentSearches: [], suggestedGenres: [], recentlyViewedBooks: [], popularGenres: [] }

      const { data: userBooks, error: userBooksError } = await supabase
        .from('books')
        .select('title,author,genre,created_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (userBooksError) throw new ApiError(asErrorMessage(userBooksError), 500, userBooksError)

      const { data: allBooks, error: allBooksError } = await supabase.from('books').select('genre').not('genre', 'is', null).limit(200)
      if (allBooksError) throw new ApiError(asErrorMessage(allBooksError), 500, allBooksError)

      const genreFreq = new Map<string, number>()
      ;(allBooks ?? []).forEach((b: any) => {
        const g = String(b.genre)
        genreFreq.set(g, (genreFreq.get(g) ?? 0) + 1)
      })

      const suggestedGenres = Array.from(
        new Set((userBooks ?? []).map((b: any) => b.genre).filter(Boolean).map((g: any) => String(g)))
      ).slice(0, 6) as string[]

      const popularGenres: string[] = Array.from(genreFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([genre]) => genre)

      return {
        recentSearches: [],
        suggestedGenres,
        recentlyViewedBooks: (userBooks ?? []).slice(0, 5).map((b: any) => ({
          title: b.title,
          author: b.author,
          genre: b.genre ?? null,
        })),
        popularGenres,
      }
    },

    getQuickSuggestions: async (query: string, limit: number = 5): Promise<BookRequestResponse[]> => {
      const q = query.trim()
      if (!q) return []
      const { data, error } = await supabase
        .from('v_open_book_requests')
        .select(requestSelect)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const rows = await hydrateRequests(data ?? [])
      const needle = q.toLowerCase()
      return rows.filter((row: BookRequestResponse) => [row.title, row.author].join(' ').toLowerCase().includes(needle))
    },

    getRecentlyServedRequests: async (limit?: number): Promise<BookRequestResponse[]> => {
      const rows = await demandApi.getOpenRequests()
      return rows.slice(0, limit ?? 20)
    },

    getWeeklyStats: async (): Promise<{ openRequests: number; completedThisWeek: number; createdThisWeek: number }> => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const [{ count: openCount, error: openError }, { count: completedCount, error: completedError }, { count: createdCount, error: createdError }] =
        await Promise.all([
          supabase.from('book_requests').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
          supabase.from('book_requests').select('*', { count: 'exact', head: true }).eq('status', 'FULFILLED').gte('updated_at', weekAgo),
          supabase.from('book_requests').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        ])
      if (openError || completedError || createdError) {
        throw new ApiError(asErrorMessage(openError ?? completedError ?? createdError), 500, openError ?? completedError ?? createdError)
      }
      return {
        openRequests: Number(openCount ?? 0),
        completedThisWeek: Number(completedCount ?? 0),
        createdThisWeek: Number(createdCount ?? 0),
      }
    },

    getMostRequestedBooks: async (limit: number = 10): Promise<Array<{ title: string; author: string; requestCount: number }>> => {
      const { data, error } = await supabase
        .from('book_requests')
        .select('book_id')
        .neq('status', 'CANCELLED')
        .limit(500)
      if (error) throw new ApiError(asErrorMessage(error), 500, error)

      const bookIds = Array.from(new Set((data ?? []).map((r: any) => r.book_id).filter(Boolean)))
      const { data: books, error: booksError } = bookIds.length
        ? await supabase.from('books').select('id,title,author').in('id', bookIds)
        : { data: [], error: null as any }
      if (booksError) throw new ApiError(asErrorMessage(booksError), 500, booksError)
      const booksById = new Map<string, { title?: string | null; author?: string | null }>(
        (books ?? []).map((row: any) => [row.id, row])
      )

      const freq = new Map<string, { title: string; author: string; requestCount: number }>()
      ;(data ?? []).forEach((r: any) => {
        const bookRow = booksById.get(r.book_id)
        const title = bookRow?.title ?? 'Unknown title'
        const author = bookRow?.author ?? 'Unknown author'
        const key = `${title}::${author}`
        const existing = freq.get(key)
        if (existing) existing.requestCount += 1
        else freq.set(key, { title, author, requestCount: 1 })
      })

      return Array.from(freq.values())
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, limit)
    },
  }

  return demandApi
}
