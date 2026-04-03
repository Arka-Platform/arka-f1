'use client'

import React from 'react'
import BookCard from '@/components/circulation/BookCard'

export default function Page() {
  const book = {
    title: 'Atomic Habits',
    image: '/atomic-habits.png',
    author: 'James Clear',
    genre: 'Self Help',
    condition: 'Like New',
    rating: 4.8,

    signals: {
      requests: 12,
      nearby: 2,
      speed: '2 hrs',
    },

    user: {
      name: 'Aarav Mehta',
      trust: 86,
    },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f1]">
      <BookCard book={book} />
    </div>
  )
}
