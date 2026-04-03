'use client'

import React from 'react'
import BookMeta from './BookMeta'
import UserInline from './UserInline'
import SignalRibbon from './SignalRibbon'

interface Props {
  book: {
    title: string
    image: string
    author: string
    genre: string
    condition: string
    rating: number
    signals?: {
      requests?: number
      nearby?: number
      speed?: string
    }
    user: {
      name: string
      trust: number
    }
  }
}

export default function BookCard({ book }: Props) {
  const signalText =
    book.signals?.requests
      ? `${book.signals.requests} requests`
      : null

  return (
    <div className="
      relative rounded-[30px]
      bg-[#f8f7f4]
      ring-1 ring-black/[0.045]
      shadow-[0_25px_70px_rgba(0,0,0,0.07)]
      overflow-hidden
    ">

      {signalText && <SignalRibbon text={signalText} />}

      <div className="px-6 py-8">

        <div className="flex gap-7">

          {/* IMAGE */}
          <div className="w-[44%]">
            <div className="[perspective:1000px]">
              <img
                src={book.image}
                alt={book.title}
                className="
                  w-full
                  rounded-[16px]
                  [transform:rotateY(-4deg)]
                  drop-shadow-[0_20px_34px_rgba(0,0,0,0.18)]
                  transition-all duration-300
                  hover:rotate-y-0 hover:scale-[1.015]
                "
              />
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 flex flex-col justify-between">

            <div>
              <h1 className="
                text-[23px]
                font-semibold
                tracking-[-0.02em]
                text-[#1c1917]
              ">
                {book.title}
              </h1>

              {/* SIGNAL LINE */}
              <div className="mt-1 text-[13px] text-[#1c1917]/50">
                {[
                  book.signals?.nearby && `${book.signals.nearby} nearby`,
                  book.signals?.speed && `ready in ${book.signals.speed}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>

              <div className="mt-3">
                <BookMeta
                  author={book.author}
                  genre={book.genre}
                  condition={book.condition}
                  rating={book.rating}
                />
              </div>
            </div>

            <UserInline
              name={book.user.name}
              trust={book.user.trust}
            />

          </div>
        </div>

      </div>
    </div>
  )
}
