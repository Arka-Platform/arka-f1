'use client'

import React from 'react'
import HeaderBar from '../../components/circulation/HeaderBar'
import BookMeta from '../../components/circulation/BookMeta'
import ActionButtons from '../../components/circulation/ActionButtons'
import UserTrustSection from '../../components/circulation/UserTrustSection'
import TagsSection from '../../components/circulation/TagsSection'

export default function CirculationPage() {
  return (
    <div className="w-full py-4 sm:py-6">
      <div className="mx-auto w-full max-w-[560px] px-0 sm:px-2">
        <div className="rounded-[24px] bg-[var(--component-surface)] ring-1 ring-[var(--app-border)] shadow-[0_10px_30px_rgba(15,23,42,0.14)] overflow-hidden">
            <HeaderBar title="Atomic Habits" />

            {/* Content card (inner surface) */}
            <div className="px-4 sm:px-6 pt-4 pb-5 sm:pb-6">
              <div className="flex flex-col gap-[14px] sm:gap-[16px]">
                <div className="rounded-[18px] bg-[var(--component-overlay)] ring-1 ring-[var(--app-border)]">
                  <div className="flex gap-4">
                    {/* LEFT: BOOK IMAGE */}
                    <div className="w-[42%] sm:w-[40%]">
                      <div className="relative rounded-[16px] bg-white/55 ring-1 ring-[var(--app-border)] shadow-[0_10px_22px_rgba(15,23,42,0.12)] overflow-hidden p-2.5">
                        <div className="[perspective:900px]">
                          <img
                            src="/atomic-habits.png"
                            alt="Atomic Habits cover"
                            className="w-full h-auto [transform:rotateY(-7deg)] [transform-origin:center] drop-shadow-[0_16px_22px_rgba(0,0,0,0.18)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: META INFO */}
                    <div className="flex-1">
                      <BookMeta
                        name="Atomic Habits"
                        author="James Clear"
                        genre="Self Help, Productivity"
                        condition="Like New"
                        rating={4.8}
                      />
                    </div>
                  </div>
                </div>

                <UserTrustSection roleLabel="Provider" userName="Aarav Mehta" trustScore={86} />

                <TagsSection tags={['12 requests', 'near you', 'fast pickup']} />

                <ActionButtons />
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}

