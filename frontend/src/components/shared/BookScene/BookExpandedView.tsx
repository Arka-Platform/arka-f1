'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBookExpandedOverlay } from './useBookInteractions'
import paper from './BookScenePaper.module.css'

export interface BookExpandedViewProps {
  open: boolean
  onClose: () => void
  title: string
  author: string
  image?: string | null
  imageAlt?: string
  genre?: string
  condition?: string
  price?: string
  availability?: string
  ctaLabel?: string
  onCta?: () => void
  ctaDisabled?: boolean
  showWishlist?: boolean
  wishlistActive?: boolean
  onWishlistToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void
  wishlistAriaLabel?: string
}

/**
 * Layer B — full-screen cinematic expansion: atmosphere → book → glass copy + single CTA.
 * No outer card frame; depth via blur, gradients, and shadows only.
 */
export function BookExpandedView({
  open,
  onClose,
  title,
  author,
  image,
  imageAlt,
  genre,
  condition,
  price,
  availability,
  ctaLabel = 'Get This Book',
  onCta,
  ctaDisabled,
  showWishlist = true,
  wishlistActive = false,
  onWishlistToggle,
  wishlistAriaLabel = 'Wishlist',
}: BookExpandedViewProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useBookExpandedOverlay(open, onClose)

  if (!mounted || !open) return null

  const node = (
    <div
      className="fixed inset-0 z-[240] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-expanded-title"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#05080f]/82 backdrop-blur-xl" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#141008] to-[#120a06]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_22%_28%,rgba(251,146,60,0.2),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_88%_72%,rgba(30,58,138,0.25),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_68%,rgba(0,0,0,0.88)_100%)]"
        aria-hidden
      />

      {showWishlist && onWishlistToggle ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onWishlistToggle(e)
          }}
          aria-label={wishlistAriaLabel}
          aria-pressed={wishlistActive}
          className={[
            'pointer-events-auto absolute right-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-full md:right-8 md:top-8',
            'bg-black/28 text-rose-100/90 shadow-[0_10px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]',
            'backdrop-blur-lg transition duration-300 hover:scale-105 hover:bg-black/38',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
            wishlistActive ? 'text-rose-400' : '',
          ].join(' ')}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill={wishlistActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
          </svg>
        </button>
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close"
        className="pointer-events-auto absolute left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-stone-200 shadow-lg backdrop-blur-md transition hover:bg-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 md:left-8 md:top-8"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="relative z-10 flex min-h-full w-full flex-1 flex-col items-center justify-center px-4 pb-10 pt-16 md:px-10 md:pb-14 md:pt-20">
        <div
          className="group/surface flex w-full max-w-6xl flex-col items-center md:flex-row md:items-center md:gap-6 lg:gap-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex w-full flex-[1.15] justify-center md:justify-start md:pl-4">
            <div className="relative [perspective:1200px]" style={{ transformStyle: 'preserve-3d' }}>
              <div
                className={[
                  'relative transition-[transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
                  'group-hover/surface:[transform:rotateY(-6deg)_rotateX(3deg)]',
                  'group-hover/surface:drop-shadow-[0_48px_90px_rgba(0,0,0,0.6)]',
                ].join(' ')}
              >
                <div
                  className="pointer-events-none absolute -inset-8 rounded-lg bg-[radial-gradient(ellipse_at_30%_40%,rgba(251,146,60,0.4),transparent_65%)] opacity-90 blur-3xl"
                  aria-hidden
                />
                {image ? (
                  <img
                    src={image}
                    alt={imageAlt ?? title}
                    loading="eager"
                    referrerPolicy="no-referrer"
                    className="relative z-10 max-h-[min(50vh,420px)] w-auto max-w-[min(88vw,320px)] object-contain md:max-h-[min(56vh,480px)] md:max-w-[min(40vw,400px)]"
                    style={{
                      filter: 'drop-shadow(24px 48px 64px rgba(0,0,0,0.75)) drop-shadow(0 0 48px rgba(251,146,60,0.08))',
                    }}
                  />
                ) : (
                  <div className="relative z-10 flex h-[min(50vh,420px)] w-[min(72vw,280px)] items-center justify-center rounded-sm bg-gradient-to-br from-stone-800 to-stone-950 shadow-2xl">
                    <span className="text-7xl opacity-35" aria-hidden>
                      📖
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-20 mt-8 w-full md:mt-0 md:max-w-md md:flex-[0.95] lg:max-w-lg">
            <div className="relative px-1 py-2 shadow-[0_32px_90px_-20px_rgba(42,32,24,0.28)]">
              <div
                className={[
                  paper.paperPanel,
                  'relative overflow-hidden rounded-[1.75rem] px-7 py-8 sm:px-9 sm:py-9',
                ].join(' ')}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/35 via-transparent to-transparent" aria-hidden />

                <div className="relative space-y-2">
                  <h2
                    id="book-expanded-title"
                    className="font-serif text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-stone-900 sm:text-3xl md:text-[1.85rem]"
                  >
                    {title}
                  </h2>
                  <p className="text-sm text-stone-600">by {author}</p>
                  {(genre || condition) && (
                    <p className="pt-3 text-[0.8125rem] text-stone-500">
                      {[genre, condition].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                {(price || availability || onCta) && (
                  <div className="relative mt-10 flex flex-col gap-6">
                    {(price || availability) && (
                      <div className="flex flex-wrap items-end gap-4">
                        {price ? (
                          <p className="font-serif text-3xl font-semibold tracking-tight text-amber-900/95">{price}</p>
                        ) : null}
                        {availability ? (
                          <p className="max-w-[14rem] text-[0.75rem] leading-snug text-stone-600">{availability}</p>
                        ) : null}
                      </div>
                    )}
                    {onCta ? (
                      <button
                        type="button"
                        onClick={onCta}
                        disabled={ctaDisabled}
                        className={[
                          'w-full rounded-full py-4 text-[0.9375rem] font-semibold tracking-wide text-stone-950',
                          'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-900',
                          'shadow-[0_12px_40px_rgba(251,146,60,0.38),inset_0_1px_0_rgba(255,255,255,0.35)]',
                          'transition duration-300 hover:brightness-[1.06]',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                          'disabled:cursor-not-allowed disabled:opacity-45',
                        ].join(' ')}
                      >
                        {ctaLabel}
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
