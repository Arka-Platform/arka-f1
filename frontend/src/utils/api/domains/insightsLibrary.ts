import type {
  AddToBookshelfRequest,
  AddToWishlistRequest,
  BookAnalyticsResponse,
  BookshelfItemResponse,
  PlatformInsightsResponse,
  TrustScoreResponse,
  UserAnalyticsResponse,
  WishlistItemResponse,
} from '../../api'

type Deps = {
  supabase: any
  ApiError: new (message: string, status: number, response?: unknown) => Error
  asErrorMessage: (error: unknown) => string
}

export function createAnalyticsApi({ supabase, ApiError, asErrorMessage }: Deps) {
  return {
    getUserAnalytics: async (userId: string): Promise<UserAnalyticsResponse> => {
      const { data, error } = await supabase.from('v_analytics_user_summary').select('*').eq('user_id', userId).maybeSingle()
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const row = data as
        | {
            total_events?: number | string | null
            completed_events?: number | string | null
            cancelled_events?: number | string | null
            last_active_day?: string | null
          }
        | null
      const totalEv = Number(row?.total_events ?? 0)
      const completedEv = Number(row?.completed_events ?? 0)
      const cancelledEv = Number(row?.cancelled_events ?? 0)
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
        reviewsWritten: totalEv,
        activityTotalEvents: totalEv,
        activityCompletedEvents: completedEv,
        activityCancelledEvents: cancelledEv,
        lastActiveDay: row?.last_active_day ?? null,
      }
    },

    getBookAnalytics: async (bookId: string): Promise<BookAnalyticsResponse> => {
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

    getPlatformInsights: async (): Promise<PlatformInsightsResponse> => {
      const { data, error } = await supabase.rpc('get_platform_insights_snapshot')
      if (error) throw new ApiError(asErrorMessage(error), 500, error)
      const p = (data ?? {}) as Record<string, unknown>
      const num = (v: unknown) => Number(v ?? 0)
      const ms = (p.monthlyStats && typeof p.monthlyStats === 'object' ? p.monthlyStats : {}) as Record<string, unknown>
      const ws = (p.weeklyStats && typeof p.weeklyStats === 'object' ? p.weeklyStats : {}) as Record<string, unknown>
      const bbg = p.booksByGenre && typeof p.booksByGenre === 'object' ? (p.booksByGenre as Record<string, unknown>) : {}
      const bbc = p.booksByCategory && typeof p.booksByCategory === 'object' ? (p.booksByCategory as Record<string, unknown>) : {}
      const booksByGenre: Record<string, number> = {}
      for (const [k, v] of Object.entries(bbg)) booksByGenre[k] = num(v)
      const booksByCategory: Record<string, number> = {}
      for (const [k, v] of Object.entries(bbc)) booksByCategory[k] = num(v)
      return {
        totalUsers: num(p.totalUsers),
        activeUsers: num(p.activeUsers),
        totalBooks: num(p.totalBooks),
        availableBooks: num(p.availableBooks),
        totalExchanges: num(p.totalExchanges),
        totalLendings: num(p.totalLendings),
        totalRevenue: num(p.totalRevenue),
        averageBookPrice: num(p.averageBookPrice),
        booksByGenre,
        booksByCategory,
        trendingBooks: [],
        popularGenres: [],
        monthlyStats: {
          newUsers: num(ms.newUsers),
          newBooks: num(ms.newBooks),
          exchanges: num(ms.exchanges),
          lendings: num(ms.lendings),
          revenue: num(ms.revenue),
        },
        weeklyStats: {
          newUsers: num(ws.newUsers),
          newBooks: num(ws.newBooks),
          exchanges: num(ws.exchanges),
          lendings: num(ws.lendings),
          revenue: num(ws.revenue),
        },
      }
    },
  }
}

export function createWishlistApi({ supabase, ApiError, asErrorMessage }: Deps) {
  const wishlistApi = {
    addToWishlist: async (userId: string, bookId: string, data?: AddToWishlistRequest): Promise<WishlistItemResponse> => {
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

    getWishlist: async (userId: string): Promise<WishlistItemResponse[]> => {
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
  }

  return wishlistApi
}

export function createBookshelfApi({ supabase, ApiError, asErrorMessage }: Deps) {
  let bookshelfAvailable: boolean | null = null

  const isMissingBookshelfRelation = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false
    const err = error as { code?: string; message?: string; details?: string }
    const code = String(err.code ?? '').toUpperCase()
    const message = String(err.message ?? '').toLowerCase()
    const details = String(err.details ?? '').toLowerCase()
    return (
      code === 'PGRST205' ||
      message.includes('bookshelf') && message.includes('does not exist') ||
      details.includes('bookshelf') && details.includes('does not exist')
    )
  }

  const markUnavailableIfMissing = (error: unknown): boolean => {
    if (isMissingBookshelfRelation(error)) {
      bookshelfAvailable = false
      return true
    }
    return false
  }

  const bookshelfApi = {
    addToBookshelf: async (userId: string, bookId: string, data?: AddToBookshelfRequest): Promise<BookshelfItemResponse> => {
      if (bookshelfAvailable === false) {
        throw new ApiError('Bookshelf is unavailable in this environment', 503)
      }
      try {
        const { error } = await supabase.from('bookshelf').insert({
          user_id: userId,
          book_id: bookId,
          notes: data?.notes ?? null,
        })
        if (error) throw error
        bookshelfAvailable = true
        const list = await bookshelfApi.getBookshelf(userId)
        const item = list.find((i) => i.bookId === bookId)
        if (!item) throw new Error('Bookshelf item not found after insert')
        return item
      } catch (error) {
        if (markUnavailableIfMissing(error)) {
          throw new ApiError('Bookshelf is unavailable in this environment', 503, error)
        }
        throw new ApiError(asErrorMessage(error), 500, error)
      }
    },

    removeFromBookshelf: async (userId: string, bookId: string) => {
      if (bookshelfAvailable === false) {
        return { message: 'Bookshelf unavailable' }
      }
      try {
        const { error } = await supabase
          .from('bookshelf')
          .delete()
          .eq('user_id', userId)
          .eq('book_id', bookId)
        if (error) throw error
        bookshelfAvailable = true
        return { message: 'Removed from bookshelf' }
      } catch (error) {
        if (markUnavailableIfMissing(error)) {
          return { message: 'Bookshelf unavailable' }
        }
        throw new ApiError(asErrorMessage(error), 500, error)
      }
    },

    getBookshelf: async (userId: string): Promise<BookshelfItemResponse[]> => {
      if (bookshelfAvailable === false) return []
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
        bookshelfAvailable = true
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
        if (markUnavailableIfMissing(error)) {
          return []
        }
        throw new ApiError(asErrorMessage(error), 500, error)
      }
    },

    checkInBookshelf: async (userId: string, bookId: string) => {
      if (bookshelfAvailable === false) return { isInBookshelf: false }
      try {
        const { count, error } = await supabase
          .from('bookshelf')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('book_id', bookId)
        if (error) throw error
        bookshelfAvailable = true
        return { isInBookshelf: (count ?? 0) > 0 }
      } catch (error) {
        if (markUnavailableIfMissing(error)) {
          return { isInBookshelf: false }
        }
        throw new ApiError(asErrorMessage(error), 500, error)
      }
    },

    getBookshelfCount: async (userId: string) => {
      if (bookshelfAvailable === false) return { count: 0 }
      try {
        const { count, error } = await supabase
          .from('bookshelf')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        if (error) throw error
        bookshelfAvailable = true
        return { count: count ?? 0 }
      } catch (error) {
        if (markUnavailableIfMissing(error)) {
          return { count: 0 }
        }
        throw new ApiError(asErrorMessage(error), 500, error)
      }
    },
  }

  return bookshelfApi
}

export function createTrustScoreApi({ supabase, ApiError, asErrorMessage }: Deps) {
  return {
    getTrustScore: async (userId: string): Promise<TrustScoreResponse> => {
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
}
