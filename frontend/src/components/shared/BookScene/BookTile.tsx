'use client'

import React from 'react'
import type { BookIconAction } from './useBookInteractions'
import paper from './BookScenePaper.module.css'

const glassIcon =
  'flex h-10 w-10 items-center justify-center rounded-full text-stone-100/90 shadow-[0_8px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-md transition duration-200 hover:scale-[1.06] hover:bg-black/35 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45'

export interface BookTileProps {
  title: string
  status: string
  image?: string | null
  /** Decorative cover when title is shown below */
  imageAlt?: string
  /** Expand immersive view — must NOT run when an icon is used (icons use iconAction). */
  onExpand: () => void
  onWishlist?: () => void
  onLibrary?: () => void
  onSwap?: () => void
  wishlistActive?: boolean
  iconAction: BookIconAction
  wishlistAriaLabel?: string
  libraryAriaLabel?: string
  swapAriaLabel?: string
  className?: string
}

/**
 * Layer A — compact list tile: cover-first, minimal copy, floating glass icons only.
 * No card chrome; depth via shadow and cover gradient only.
 */
export function BookTile({
  title,
  status,
  image,
  imageAlt = '',
  onExpand,
  onWishlist,
  onLibrary,
  onSwap,
  wishlistActive = false,
  iconAction,
  wishlistAriaLabel = 'Wishlist',
  libraryAriaLabel = 'Library',
  swapAriaLabel = 'Give or swap',
  className = '',
}: BookTileProps) {
  return (
    <div className={['relative w-full max-w-[200px]', className].join(' ')}>
      <div className="relative">
        <div
          className={[
            'relative aspect-[2/3] w-full overflow-hidden rounded-sm',
            'shadow-[0_28px_56px_-16px_rgba(0,0,0,0.65),0_12px_24px_-8px_rgba(0,0,0,0.45)]',
          ].join(' ')}
        >
          {image ? (
            <img
              src={image}
              alt={imageAlt}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 text-4xl opacity-40">
              📖
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
            aria-hidden
          />

          {/* Full-cover expand target — below icons */}
          <button
            type="button"
            onClick={onExpand}
            aria-label={`Open ${title}`}
            className="absolute inset-0 z-[1] cursor-pointer bg-transparent"
          />

          {/* Floating quick actions — above expand layer */}
          <div className="pointer-events-none absolute inset-0 z-[2]">
            {onWishlist ? (
              <button
                type="button"
                onClick={iconAction(onWishlist)}
                aria-label={wishlistAriaLabel}
                aria-pressed={wishlistActive}
                className={[
                  'pointer-events-auto absolute right-2 top-2',
                  glassIcon,
                  wishlistActive ? 'bg-rose-500/25 text-rose-200' : 'bg-black/22',
                ].join(' ')}
              >
                <svg className="h-[1.1rem] w-[1.1rem]" viewBox="0 0 24 24" fill={wishlistActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
                </svg>
              </button>
            ) : null}

            <div className="pointer-events-auto absolute bottom-1/2 right-2 flex translate-y-1/2 flex-col gap-2">
              {onLibrary ? (
                <button
                  type="button"
                  onClick={iconAction(onLibrary)}
                  aria-label={libraryAriaLabel}
                  className={[glassIcon, 'bg-black/22'].join(' ')}
                >
                  <svg className="h-[1.05rem] w-[1.05rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M8 7h8M8 11h6" />
                  </svg>
                </button>
              ) : null}
              {onSwap ? (
                <button
                  type="button"
                  onClick={iconAction(onSwap)}
                  aria-label={swapAriaLabel}
                  className={[glassIcon, 'bg-black/22'].join(' ')}
                >
                  <svg className="h-[1.05rem] w-[1.05rem]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M17 1l4 4-4 4" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <path d="M7 23l-4-4 4-4" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExpand}
          className={[
            paper.paperTileStrip,
            'mt-2.5 w-full cursor-pointer rounded-md px-2.5 py-2 text-left',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5efe6]',
          ].join(' ')}
        >
          <span className="line-clamp-2 text-[0.8125rem] font-medium leading-snug tracking-tight text-stone-800">{title}</span>
          <span className="mt-0.5 block text-[0.6875rem] text-stone-600">{status}</span>
        </button>
      </div>
    </div>
  )
}
