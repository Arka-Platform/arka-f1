'use client'

import React from 'react'
import BookMeta from '../../components/circulation/BookMeta'
import UserTrustSection from '../../components/circulation/UserTrustSection'
import SignalRibbon from '../../components/circulation/SignalRibbon'

export default function CirculationPage() {
  return (
    <div className="w-full py-12 bg-[#f6f5f2]">
      <div className="mx-auto w-full max-w-[560px] px-4">

        {/* CARD */}
        <div className="
          relative rounded-[28px]
          bg-[#f8f7f4]
          ring-1 ring-black/[0.05]
          shadow-[0_30px_80px_rgba(0,0,0,0.08)]
          overflow-hidden
          transition-all duration-300
          hover:shadow-[0_40px_100px_rgba(0,0,0,0.12)]
        ">

          {/* RIBBON */}
          <SignalRibbon text="12 requests" variant="highlight" />

          <div className="px-6 py-7">

            <div className="flex gap-6">

              {/* IMAGE — CLEAN (no box) */}
              <div className="w-[42%] flex-shrink-0">
                <div className="[perspective:1000px]">
                  <img
                    src="/atomic-habits.png"
                    alt="Atomic Habits cover"
                    className="
                      w-full h-auto
                      rounded-[14px]
                      [transform:rotateY(-5deg)]
                      drop-shadow-[0_18px_28px_rgba(0,0,0,0.18)]
                      transition-transform duration-300
                      hover:rotate-y-0 hover:scale-[1.02]
                    "
                  />
                </div>
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex-1 flex flex-col justify-between">

                {/* TITLE + INFO */}
                <div>
                  <h1 className="
                    text-[24px]
                    leading-[1.15]
                    font-semibold
                    tracking-[-0.02em]
                    text-[#1c1917]
                  ">
                    Atomic Habits
                  </h1>

                  {/* SIGNAL LINE (clean, no clutter) */}
                  <div className="
                    mt-1 text-[13px]
                    text-[#1c1917]/55
                    tracking-[-0.01em]
                  ">
                    2 nearby · fast pickup
                  </div>

                  {/* META */}
                  <div className="mt-3">
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
                  mt-6 pt-3
                  border-t border-black/[0.06]
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
