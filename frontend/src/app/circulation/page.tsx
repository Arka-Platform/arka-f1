'use client'

import React from 'react'
import BookMeta from '../../components/circulation/BookMeta'
import UserTrustSection from '../../components/circulation/UserTrustSection'

export default function CirculationPage() {
  return (
    <div className="w-full py-12 bg-[#f8f7f4]">
      <div className="mx-auto w-full max-w-[560px] px-4">

        {/* CARD */}
        <div className="
          relative rounded-[32px]
          bg-gradient-to-br from-[#f4f3ef] via-[#f7f6f2] to-[#eceae4]
          ring-1 ring-black/[0.04]
          shadow-[0_40px_120px_rgba(0,0,0,0.10)]
          overflow-hidden
          transition-all duration-500
          hover:shadow-[0_60px_140px_rgba(0,0,0,0.14)]
        ">

          {/* LIGHT */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.6),transparent_60%)]" />

          <div className="relative px-6 py-7">

            <div className="flex gap-6">

              {/* IMAGE */}
              <div className="w-[44%] flex-shrink-0">
                <div className="
                  relative rounded-[20px]
                  bg-white/80
                  ring-1 ring-black/[0.05]
                  shadow-[0_25px_50px_rgba(0,0,0,0.12)]
                  p-3
                  transition-all duration-500
                  hover:scale-[1.04]
                ">
                  <div className="[perspective:1200px]">
                    <img
                      src="/atomic-habits.png"
                      alt="Atomic Habits cover"
                      className="
                        w-full h-auto
                        [transform:rotateY(-6deg)]
                        drop-shadow-[0_28px_40px_rgba(0,0,0,0.20)]
                      "
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex-1 flex flex-col justify-between">

                {/* TITLE BLOCK */}
                <div>
                  <h1 className="
                    text-[26px]
                    leading-[1.1]
                    font-semibold
                    tracking-[-0.03em]
                    text-[#1c1917]
                  ">
                    Atomic Habits
                  </h1>

                  {/* SUBTLE SIGNALS (INLINE, EDITORIAL) */}
                  <div className="mt-1 text-[13px] text-[#1c1917]/55 tracking-[-0.01em]">
                    12 requests · 2 nearby · fast pickup
                  </div>

                  {/* META */}
                  <div className="mt-3 opacity-80">
                    <BookMeta
                      name=""
                      author="James Clear"
                      genre="Self Help, Productivity"
                      condition="Like New"
                      rating={4.8}
                    />
                  </div>
                </div>

                {/* USER */}
                <div className="
                  mt-5 pt-3
                  border-t border-black/[0.05]
                ">
                  <UserTrustSection
                    userName="Aarav Mehta"
                    trustScore={86}
                  />
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
