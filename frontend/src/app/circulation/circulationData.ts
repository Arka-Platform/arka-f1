import type { BookResponse, ListingCondition, ListingResponse, SwapRequestCounts } from '../../utils/api'

export function formatCondition(c: ListingCondition): string {
  const map: Record<ListingCondition, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good Condition',
    fair: 'Fair',
    poor: 'Poor',
  }
  return map[c] ?? c
}

export function buildTagPair(listing: ListingResponse): [string, string] {
  const genre = listing.genre?.trim() || listing.tags?.[0]?.trim() || 'General'
  const condition = formatCondition(listing.condition)
  return [genre, condition]
}

export function trustToRatingDisplay(trustScore: number): string {
  if (!Number.isFinite(trustScore) || trustScore <= 0) return '4.0'
  const r = (trustScore / 100) * 2 + 3
  return Math.min(5, Math.max(3, Math.round(r * 10) / 10)).toFixed(1)
}

export function mediaCountForListing(listing: ListingResponse): number {
  const n = listing.conditionImageUrls.length + (listing.coverUrl ? 1 : 0)
  return Math.max(0, n)
}

export function buildTagPairFromBook(book: BookResponse): [string, string] {
  const genre = book.genre?.trim() || 'General'
  const status = (book.status || 'AVAILABLE').replace(/_/g, ' ')
  return [genre, status]
}

export function mediaCountForBook(book: BookResponse): number {
  return (book.imageUrl || book.thumbnailUrl ? 1 : 0)
}

export function sortListingsByDemand(
  listings: ListingResponse[],
  counts: Record<string, SwapRequestCounts>
): ListingResponse[] {
  return [...listings].sort((a, b) => {
    const ca = counts[a.listingId] ?? { requestCount: 0, circulationCount: 0 }
    const cb = counts[b.listingId] ?? { requestCount: 0, circulationCount: 0 }
    if (cb.requestCount !== ca.requestCount) return cb.requestCount - ca.requestCount
    if (cb.circulationCount !== ca.circulationCount) return cb.circulationCount - ca.circulationCount
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function displayNameFromProfile(firstName: string, lastName: string, email: string): string {
  const full = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  if (full) return full
  if (email) return email.split('@')[0] ?? 'Reader'
  return 'Reader'
}

export function firstNameOnly(firstName: string, _lastName: string, displayName: string): string {
  const fn = firstName?.trim()
  if (fn) return fn
  const fromDisplay = displayName.split(/\s+/)[0]
  return fromDisplay || 'Reader'
}

export function avatarUrlForUserId(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0
  return `https://i.pravatar.cc/80?img=${h % 70}`
}
