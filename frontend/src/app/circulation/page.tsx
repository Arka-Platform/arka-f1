'use client'

import React from 'react'
import HeaderBar from '../../components/circulation/HeaderBar'
import BookMeta from '../../components/circulation/BookMeta'
import ActionButtons from '../../components/circulation/ActionButtons'
import UserTrustSection from '../../components/circulation/UserTrustSection'
import TagsSection from '../../components/circulation/TagsSection'

export default function CirculationPage() {
  return (
    <div className="w-full py-6">
      <div className="mx-auto w-full max-w-[560px] px-2">

        {/* OUTER CARD */}
        <div className="rounded-[28px] bg-[var(--component-surface)] ring-1 ring-[var(--app-border)] shadow-[0_20px_60px_rgba(15,23,42,0.12)] overflow-hidden transition-all duration-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.16)]">

          <HeaderBar title="Atomic Habits" />

          {/* CONTENT */}
          <div className="px-5 sm:px-6 pt-5 pb-6">
            <div className="flex flex-col gap-5">

              {/* MAIN BLOCK (Image + Meta + User) */}
              <div className="rounded-[20px] bg-[var(--component-overlay)] ring-1 ring-[var(--app-border)] p-3.5 sm:p-4 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)]">

                <div className="flex gap-4">

                  {/* LEFT: BOOK IMAGE */}
                  <div className="w-[40%]">
                    <div className="relative rounded-[16px] bg-white/60 ring-1 ring-[var(--app-border)] shadow-[0_12px_28px_rgba(15,23,42,0.12)] overflow-hidden p-2.5 transition-transform duration-300 hover:scale-[1.02]">
                      <div className="[perspective:1000px]">
                        <img
                          src="/atomic-habits.png"
                          alt="Atomic Habits cover"
                          className="w-full h-auto [transform:rotateY(-6deg)] [transform-origin:center] drop-shadow-[0_18px_28px_rgba(0,0,0,0.18)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: META + USER */}
                  <div className="flex-1 flex flex-col justify-between gap-3">

                    {/* BOOK META */}
                    <BookMeta
                      name="Atomic Habits"
                      author="James Clear"
                      genre="Self Help, Productivity"
                      condition="Like New"
                      rating={4.8}
                    />

                    {/* USER (MINIMIZED + INTEGRATED) */}
                    <div className="pt-2 border-t border-[var(--app-border)]/60">
                      <UserTrustSection
                        roleLabel="Provider"
                        userName="Aarav Mehta"
                        trustScore={86}
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* TAGS (SOFT + SUBTLE) */}
              <div className="px-1">
                <TagsSection tags={['12 requests', 'near you', 'fast pickup']} />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}