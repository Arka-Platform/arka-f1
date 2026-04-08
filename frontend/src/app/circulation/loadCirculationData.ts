/**
 * Circulation UI ↔ Supabase:
 * - Primary: active marketplace rows (book_listings + inventory_books + books + swap_requests + users).
 * - Fallback: catalog rows from public.books when no active listings (same UI, links to Exchange).
 */
import {
  booksApi,
  listingsApi,
  swapRequestsApi,
  trustScoreApi,
  usersApi,
  type BookResponse,
  type ListingResponse,
  type SwapRequestCounts,
  type TrustScoreResponse,
} from '../../utils/api'
import {
  avatarUrlForUserId,
  displayNameFromProfile,
  firstNameOnly,
  sortListingsByDemand,
  trustToRatingDisplay,
} from './circulationData'

export type CirculationOwner = {
  displayName: string
  firstName: string
  avatarUrl: string
  ratingDisplay: string
  /** Raw trust score (0–100). */
  trustScore: number
  /** Trust breakdown for details UI. */
  trust: TrustScoreResponse | null
}

const CATALOG_OWNER_KEY = '__catalog__'

export type CirculationPayload =
  | {
      kind: 'listings'
      listings: ListingResponse[]
      counts: Record<string, SwapRequestCounts>
      owners: Record<string, CirculationOwner>
    }
  | {
      kind: 'catalog'
      books: BookResponse[]
      owners: Record<string, CirculationOwner>
    }

async function enrichOwners(ownerIds: string[]): Promise<Record<string, CirculationOwner>> {
  const owners = await Promise.all(
    ownerIds.map(async (oid) => {
      try {
        const [profile, trust] = await Promise.all([
          usersApi.getById(oid),
          trustScoreApi.getTrustScore(oid).catch(() => null),
        ])
        const displayName = displayNameFromProfile(profile.firstName, profile.lastName, profile.email)
        const firstName = firstNameOnly(profile.firstName, profile.lastName, displayName)
        const trustScore = trust?.trustScore ?? 0
        const ratingDisplay = trustToRatingDisplay(trustScore)
        const enrichment: CirculationOwner = {
          displayName,
          firstName,
          avatarUrl: avatarUrlForUserId(oid),
          ratingDisplay,
          trustScore,
          trust,
        }
        return [oid, enrichment] as const
      } catch {
        const fallback: CirculationOwner = {
          displayName: 'Community member',
          firstName: 'Reader',
          avatarUrl: avatarUrlForUserId(oid),
          ratingDisplay: '4.0',
          trustScore: 0,
          trust: null,
        }
        return [oid, fallback] as const
      }
    }),
  )
  return Object.fromEntries(owners)
}

export async function loadCirculationFromSupabase(): Promise<CirculationPayload> {
  const raw = await listingsApi.listActive({ limit: 40 })
  if (raw.length > 0) {
    const listingIds = raw.map((l) => l.listingId)
    const countMap = await swapRequestsApi.getCountsByListingIds({ listingIds })
    const sorted = sortListingsByDemand(raw, countMap)
    const ownerIds = [...new Set(sorted.map((l) => l.ownerId).filter(Boolean))]
    const owners = await enrichOwners(ownerIds)
    return {
      kind: 'listings',
      listings: sorted,
      counts: countMap,
      owners,
    }
  }

  const books = await booksApi.list({ page: 0, size: 24 })
  if (books.length === 0) {
    return { kind: 'catalog', books: [], owners: {} }
  }

  const ownerIds = [...new Set(books.map((b) => b.ownerId).filter(Boolean))] as string[]
  const owners = await enrichOwners(ownerIds)
  owners[CATALOG_OWNER_KEY] = {
    displayName: 'Community',
    firstName: 'Community',
    avatarUrl: avatarUrlForUserId('catalog-community'),
    ratingDisplay: '4.0',
    trustScore: 0,
    trust: null,
  }

  return {
    kind: 'catalog',
    books,
    owners,
  }
}

export function ownerKeyForBook(book: BookResponse): string {
  return book.ownerId ?? CATALOG_OWNER_KEY
}
