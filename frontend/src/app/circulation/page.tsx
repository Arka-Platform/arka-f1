'use client'

import React from 'react'
import BookMeta from '../../components/circulation/BookMeta'
import UserTrustSection from '../../components/circulation/UserTrustSection'
import TagsSection from '../../components/circulation/TagsSection'

export default function CirculationPage() {
  return (
    <div className="w-full py-10">
      <div className="mx-auto w-full max-w-[560px] px-3">

        {/* SINGLE SURFACE CARD */}
        <div className="rounded-[28px] bg-[#f5f5f4] ring-1 ring-black/[0.06] shadow-[0_30px_80px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_40px_100px_rgba(0,0,0,0.12)]">

          <div className="px-6 py-7">
            <div className="flex flex-col gap-7">

              {/* TOP: IMAGE + CONTENT */}
              <div className="flex gap-5">

                {/* LEFT: BOOK IMAGE */}
                <div className="w-[42%]">
                  <div className="relative rounded-[18px] bg-white/70 ring-1 ring-black/[0.05] shadow-[0_16px_36px_rgba(0,0,0,0.10)] overflow-hidden p-2.5 transition-all duration-300 hover:scale-[1.025]">
                    <div className="[perspective:1000px]">
                      <img
                        src="/atomic-habits.png"
                        alt="Atomic Habits cover"
                        className="w-full h-auto [transform:rotateY(-5deg)] drop-shadow-[0_22px_32px_rgba(0,0,0,0.18)]"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT: TITLE + META + USER */}
                <div className="flex-1 flex flex-col justify-between">

                  {/* TITLE (PRIMARY FOCUS) */}
                  <div>
                    <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.025em] text-[#1c1917]">
                      Atomic Habits
                    </h1>

                    {/* META */}
                    <div className="mt-2">
                      <BookMeta
                        name="" // avoid duplication
                        author="James Clear"
                        genre="Self Help, Productivity"
                        condition="Like New"
                        rating={4.8}
                      />
                    </div>
                  </div>

                  {/* USER */}
                  <div className="pt-3 mt-4 border-t border-black/[0.06]">
                    <UserTrustSection
                      userName="Aarav Mehta"
                      trustScore={86}
                    />
                  </div>

                </div>
              </div>

              {/* TAGS */}
              <div>
                <TagsSection tags={['12 requests', 'near you', 'fast pickup']} />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
