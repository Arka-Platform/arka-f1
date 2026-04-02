export interface Book {
  id: string
  title: string
  description: string
  genre?: string
  price?: string | number
  image?: string
  thumbnail?: string
  author?: string
  status?: string
  publisher?: string
  publicationYear?: number
  averageRating?: number
  ratingsCount?: number
  /** Optional: how many people are looking for this title (UI-only, when available). */
  requestCount?: number
}

