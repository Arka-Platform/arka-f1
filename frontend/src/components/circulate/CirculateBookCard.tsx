'use client'

import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ListingCondition, SwapRequestStatus } from '../../utils/api'

export interface CirculateBookCardModel {
  listingId: string
  bookId: string
  ownerId: string

  title: string
  author: string
  genre: string | null
  description: string
  condition: ListingCondition
  tags: string[]
  coverUrl: string | null

  distanceMeters: number | null
  distanceKm: number | null
  nearTag: string | null

  requestCount: number
  circulationCount: number

  providerName: string
  providerTrustScore: number | null

  wishlistActive: boolean
  ownedInventoryBookId: string | null
  passActive: boolean
  pickActiveStatus: SwapRequestStatus | null

  /**
   * If false, the backend listing/workflow isn't available for this card.
   * We still allow details + wishlist, but we disable Pick/Pass to avoid failed actions.
   */
  actionsEnabled?: boolean
}

export interface CirculateBookCardProps {
  model: CirculateBookCardModel
  loadingPick?: boolean
  loadingPass?: boolean
  loadingWishlist?: boolean

  onPick: () => void | Promise<void>
  onPass: () => void | Promise<void>
  onToggleWishlist: () => void | Promise<void>
  onOpenMyLibrary: () => void
}

function initials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function trustPillClasses(score: number | null): string {
  if (score == null) return 'bg-slate-100 text-slate-700 ring-slate-200'
  if (score >= 85) return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  if (score >= 70) return 'bg-amber-50 text-amber-900 ring-amber-200'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function conditionLabel(condition: string): string {
  const c = (condition ?? '').toLowerCase()
  if (!c) return 'Listed'
  return c
    .split('_')
    .join(' ')
    .replace(/\\b\\w/g, (m) => m.toUpperCase())
}

export default function CirculateBookCard({
  model,
  loadingPick = false,
  loadingPass = false,
  loadingWishlist = false,
  onPick,
  onPass,
  onToggleWishlist,
  onOpenMyLibrary,
}: CirculateBookCardProps) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)

  const requestChip = model.requestCount > 0 ? `${model.requestCount} requests` : 'Be first'
  const nearChip = model.nearTag ? model.nearTag : model.distanceKm != null ? `${model.distanceKm.toFixed(1)} km` : null

  const actionsEnabled = model.actionsEnabled ?? true
  const pickDisabled = !actionsEnabled || model.pickActiveStatus != null || loadingPick
  const passDisabled = !actionsEnabled || model.passActive || loadingPass

  const pickLabel = !actionsEnabled
    ? 'Pick (unavailable)'
    : model.pickActiveStatus
    ? model.pickActiveStatus === 'accepted'
      ? 'Accepted'
      : 'Requested'
    : loadingPick
      ? 'Picking…'
      : 'Pick'

  const passLabel = !actionsEnabled
    ? 'Pass (unavailable)'
    : passDisabled
    ? model.passActive
      ? 'In circulation'
      : 'Giving…'
    : model.ownedInventoryBookId
      ? 'Pass'
      : 'Add to give'

  const tap = reduceMotion ? {} : { whileTap: { scale: 0.98 } }

  const sheetTitle = useMemo(() => `${model.title} • ${model.author}`, [model.title, model.author])

  return (
    <>
      <motion.article
        layout
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="relative overflow-hidden rounded-[1.35rem] bg-white ring-1 ring-slate-900/[0.07] shadow-[0_10px_26px_-22px_rgba(15,23,42,0.3)]"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`Open details for ${sheetTitle}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(true)
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 opacity-90" />

        <div className="flex gap-3 p-3">
          <div className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/[0.04]">
            {model.coverUrl ? (
              <img src={model.coverUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">
                Arka
              </div>
            )}
            {model.nearTag && (
              <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800 ring-1 ring-emerald-200">
                Near
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-[0.98rem] font-extrabold leading-tight tracking-tight text-slate-900">
                  {model.title}
                </p>
                <p className="mt-0.5 truncate text-[0.78rem] font-semibold text-slate-500">{model.author}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={model.wishlistActive ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={(e) => {
                    e.stopPropagation()
                    void onToggleWishlist()
                  }}
                  disabled={loadingWishlist}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 ring-1 ring-slate-200/80 transition hover:bg-white disabled:opacity-60"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill={model.wishlistActive ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="Open my library"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenMyLibrary()
                  }}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 ring-1 ring-slate-200/80 transition hover:bg-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[0.7rem] font-bold text-slate-700 ring-1 ring-slate-200/70">
                {conditionLabel(model.condition)}
              </span>
              {model.genre && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[0.7rem] font-bold text-violet-800 ring-1 ring-violet-200/70">
                  {model.genre}
                </span>
              )}
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-800 ring-1 ring-emerald-200/70">
                {requestChip}
              </span>
              {nearChip && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[0.7rem] font-bold text-slate-700 ring-1 ring-slate-200/70">
                  {nearChip}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-[0.72rem] font-extrabold text-white ring-2 ring-white shadow-md">
                {initials(model.providerName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.82rem] font-extrabold text-slate-900">{model.providerName}</p>
                {model.providerTrustScore != null ? (
                  <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Trust {Math.round(model.providerTrustScore)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400">Trusted reader</p>
                )}
              </div>
              {model.providerTrustScore != null && (
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[0.68rem] font-extrabold ring-1 ${trustPillClasses(model.providerTrustScore)}`}>
                  {Math.round(model.providerTrustScore)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100/90 bg-slate-50/70 p-3">
          <motion.button
            type="button"
            {...tap}
            onClick={(e) => {
              e.stopPropagation()
              void onPass()
            }}
            disabled={passDisabled}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200/90 text-[0.95rem] font-extrabold text-slate-800 transition disabled:opacity-60"
          >
            {model.passActive ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            )}
            {passLabel}
          </motion.button>

          <motion.button
            type="button"
            {...tap}
            onClick={(e) => {
              e.stopPropagation()
              void onPick()
            }}
            disabled={pickDisabled}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-[0.95rem] font-extrabold text-white shadow-[0_10px_26px_-18px_rgba(16,185,129,0.65)] transition disabled:opacity-60"
          >
            {pickDisabled ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M12 20l9-5-9-5-9 5 9 5z" />
                <path d="M12 12l9-5-9-5-9 5 9 5z" opacity="0.35" />
              </svg>
            )}
            {pickLabel}
          </motion.button>
        </div>
      </motion.article>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${sheetTitle}`}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-[430px] overflow-hidden rounded-[1.45rem] bg-white shadow-[0_22px_60px_-28px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/[0.08]"
              initial={reduceMotion ? false : { y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: 22, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-slate-200" />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{model.title}</h2>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">{model.author}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.74rem] font-bold text-emerald-800 ring-1 ring-emerald-200/70">
                        {requestChip}
                      </span>
                      {nearChip && (
                        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[0.74rem] font-bold text-slate-700 ring-1 ring-slate-200/70">
                          {nearChip}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[0.74rem] font-bold text-slate-700 ring-1 ring-slate-200/70">
                        {conditionLabel(model.condition)}
                      </span>
                      {model.genre && (
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[0.74rem] font-bold text-violet-800 ring-1 ring-violet-200/70">
                          {model.genre}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 ring-1 ring-slate-200/70 transition hover:bg-slate-100"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                  >
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 px-4 pb-4">
                <div className="relative h-[170px] w-[120px] shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/[0.05]">
                  {model.coverUrl ? (
                    <img src={model.coverUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-extrabold uppercase tracking-widest text-slate-400">
                      Arka
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-[0.78rem] font-extrabold text-white ring-2 ring-white shadow-md">
                      {initials(model.providerName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[0.95rem] font-extrabold text-slate-900">{model.providerName}</p>
                      <p className="mt-1 text-[0.74rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {model.providerTrustScore != null ? `Trust ${Math.round(model.providerTrustScore)}` : 'Trusted reader'}
                      </p>
                    </div>
                    {model.providerTrustScore != null && (
                      <span className={`ml-auto rounded-full px-2 py-1 text-[0.74rem] font-extrabold ring-1 ${trustPillClasses(model.providerTrustScore)}`}>
                        {Math.round(model.providerTrustScore)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-bold text-slate-800">Why you’re seeing this</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {model.requestCount > 0
                        ? `${model.requestCount} people want this right now.`
                        : 'Be the first pick — it gets the book moving.'}
                      {model.nearTag ? ' You are close by.' : ''}
                    </p>
                    {model.circulationCount > 0 && (
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {model.circulationCount} successful circulations
                      </p>
                    )}
                  </div>

                  {model.tags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-slate-800">Tags</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {model.tags.slice(0, 6).map((t) => (
                          <span key={t} className="rounded-full bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 px-2 py-1 text-[0.72rem] font-bold text-violet-900 ring-1 ring-violet-500/15">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {model.description && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                  <p className="text-sm font-bold text-slate-800">About</p>
                  <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">{model.description}</p>
                </div>
              )}

              <div className="border-t border-slate-100 bg-white p-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void onPass()
                    }}
                    disabled={passDisabled}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-slate-200/90 text-[0.98rem] font-extrabold text-slate-800 transition disabled:opacity-60"
                  >
                    {passDisabled && model.passActive ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    )}
                    {passLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void onPick()
                    }}
                    disabled={pickDisabled}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-[0.98rem] font-extrabold text-white shadow-[0_10px_26px_-18px_rgba(16,185,129,0.65)] transition disabled:opacity-60"
                  >
                    {pickDisabled ? (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M12 20l9-5-9-5-9 5 9 5z" />
                        <path d="M12 12l9-5-9-5-9 5 9 5z" opacity="0.35" />
                      </svg>
                    )}
                    {pickLabel}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void onToggleWishlist()}
                    disabled={loadingWishlist}
                    className={`h-11 rounded-2xl ring-1 transition ${
                      model.wishlistActive
                        ? 'bg-rose-50 ring-rose-200 text-rose-700'
                        : 'bg-slate-50 ring-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex h-full items-center justify-center gap-2 font-extrabold">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill={model.wishlistActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                      </svg>
                      Wishlist
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenMyLibrary}
                    className="h-11 rounded-2xl bg-white ring-1 ring-slate-200 text-slate-800 transition hover:bg-slate-50"
                  >
                    <div className="flex h-full items-center justify-center gap-2 font-extrabold">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      My Library
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
