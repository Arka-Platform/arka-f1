'use client'

import React from 'react'
import HeaderBar from '../../components/circulation/HeaderBar'
import BookMeta from '../../components/circulation/BookMeta'
import AboutSection from '../../components/circulation/AboutSection'
import StatsSection from '../../components/circulation/StatsSection'
import ActionButtons from '../../components/circulation/ActionButtons'

export default function CirculationPage() {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(90%_75%_at_50%_0%,#fff3b0_0%,#f2c24f_55%,#d49a24_100%)] px-4 py-8">
      {/* Page container */}
      <div className="mx-auto w-full max-w-[420px]">
        {/* Main Card */}
        <div
          className={[
            'rounded-[32px]',
            'shadow-[0_26px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]',
            'bg-[linear-gradient(180deg,#caa24b_0%,#b4812f_34%,#8a571f_100%)]',
            'p-[10px]',
            'overflow-hidden',
          ].join(' ')}
        >
          {/* Inner elevated card */}
          <div className="rounded-[28px] bg-[linear-gradient(180deg,#fbfaf7_0%,#f3f1ec_100%)] ring-1 ring-black/[0.06] shadow-[0_14px_34px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.04)] overflow-hidden">
            <HeaderBar title="Atomic Habits" />

            {/* Content card (inner surface) */}
            <div className="px-5 pt-5 pb-6">
              <div className="rounded-[24px] bg-[#f8f6f2] p-4 ring-1 ring-black/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <div className="flex gap-4">
                  {/* LEFT: BOOK IMAGE */}
                  <div className="w-[40%]">
                    <div className="relative rounded-[18px] bg-white/70 ring-1 ring-black/[0.05] shadow-[0_16px_34px_rgba(0,0,0,0.10)] overflow-hidden p-3">
                      <div className="[perspective:900px]">
                        <img
                          src="/atomic-habits.png"
                          alt="Atomic Habits cover"
                          className="w-full h-auto [transform:rotateY(-12deg)] [transform-origin:center] drop-shadow-[0_22px_30px_rgba(0,0,0,0.20)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: META INFO */}
                  <div className="flex-1">
                    <BookMeta genre="Self Help, Productivity" published="2018" pages="320" rating={4.8} />
                  </div>
                </div>
              </div>

              <AboutSection text="Proven guide to building good habits and breaking bad ones. Transform your life, one small step at a time." />

              <StatsSection
                copiesSold="10 Million"
                readTime="5–6 Hours"
                keyConcepts="Habit Stacking, 1% Better Everyday"
              />

              <ActionButtons />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

