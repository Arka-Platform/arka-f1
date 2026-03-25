export type BrowseBook = {
  id: string
  title: string
  author: string
  genre: string
  condition: string
  isbn: string
  priceInr: number
  rating: number
  ratingCount: number
}

export const browseBooks: BrowseBook[] = [
  {
    id: 'the-forgotten-realm',
    title: 'The Forgotten Realm',
    author: 'James Holden',
    genre: 'Fantasy / Adventure',
    condition: 'Worn edges · Water damage · Underlining',
    isbn: '978-1234567890',
    priceInr: 299,
    rating: 4.8,
    ratingCount: 1240,
  },
  {
    id: 'mysteries-of-time',
    title: 'Mysteries of Time',
    author: 'Anya Clarke',
    genre: 'Sci‑Fi / Mystery',
    condition: 'Like new · Clean pages',
    isbn: '978-0192837465',
    priceInr: 349,
    rating: 4.6,
    ratingCount: 820,
  },
  {
    id: 'galactic-odyssey',
    title: 'Galactic Odyssey',
    author: 'R. K. Iyer',
    genre: 'Sci‑Fi / Space',
    condition: 'Creased cover · Worn spine',
    isbn: '978-0679417392',
    priceInr: 279,
    rating: 4.4,
    ratingCount: 560,
  },
  {
    id: 'lost-in-the-mist',
    title: 'Lost in the Mist',
    author: 'Mira Sen',
    genre: 'Literary / Drama',
    condition: 'Good · No missing pages',
    isbn: '978-0345391803',
    priceInr: 319,
    rating: 4.7,
    ratingCount: 410,
  },
]

