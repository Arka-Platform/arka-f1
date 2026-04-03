'use client'

import Image from 'next/image'
import { Heart, Bell } from 'lucide-react'

const books = [
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    image: '/midnight.jpg',
    tag1: 'Fiction',
    tag2: 'Good Condition',
    rating: 4.4,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    image: '/sapiens.jpg',
    tag1: 'Non-Fiction',
    tag2: 'Like New',
    rating: 4.7,
  },
]

export default function Page() {
  return (
    <div className="min-h-screen bg-[#F4F1EC] flex items-center justify-center">
      {/* Mobile Frame */}
      <div className="w-[390px] h-[844px] bg-[#F8F5F0] rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-[22px] font-serif leading-tight">arka’s</h1>
            <p className="text-sm text-gray-500">books</p>
          </div>

          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <div className="w-9 h-9 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* Title */}
        <div className="px-6">
          <p className="text-[20px] leading-snug">
            <span className="font-semibold text-[#2B2B2B]">Books, shared.</span>{' '}
            <span className="italic text-[#8A8A8A]">Stories, continued.</span>
          </p>
        </div>

        {/* Cards Section */}
        <div className="flex-1 relative mt-6 px-6">
          {books.map((book, i) => (
            <div
              key={i}
              className="absolute w-full bg-white rounded-[28px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
              style={{
                transform: `scale(${1 - i * 0.05}) translateY(${i * 14}px)`,
                zIndex: books.length - i,
              }}
            >
              <div className="relative">
                <Image
                  src={book.image}
                  alt={book.title}
                  width={320}
                  height={260}
                  className="rounded-[20px] object-cover"
                />

                <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <h2 className="mt-4 text-[18px] font-semibold text-[#2B2B2B]">
                {book.title}
              </h2>
              <p className="text-sm text-[#8A8A8A]">{book.author}</p>

              <div className="flex gap-2 mt-2 text-xs">
                <span className="bg-gray-100 px-2 py-1 rounded-full">
                  {book.tag1}
                </span>
                <span className="bg-green-100 px-2 py-1 rounded-full">
                  {book.tag2}
                </span>
              </div>

              <div className="mt-3 text-sm">⭐ {book.rating}</div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-4">
          <div className="bg-[#F8F5F0] rounded-[28px] p-4 shadow-inner grid grid-cols-4 gap-3">
            {['Pick', 'Pass', 'Wishlist', 'Shelf'].map((item, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-[20px] p-3 ${
                  i === 0
                    ? 'bg-[#F6C453] shadow-[0_6px_15px_rgba(246,196,83,0.5)]'
                    : 'bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 bg-black rounded" />
                <p className="text-xs mt-2">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
