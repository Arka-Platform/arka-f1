'use client'

import React from 'react'

export interface ImmersiveBookSurfaceProps {
  title: string
  author: string
  image?: string | null
  imageAlt?: string
  genre?: string
  condition?: string
  /** Shown near CTA, e.g. ₹299 */
  price?: string
  /** Short line, e.g. “In stock · ships this week” */
  availability?: string
  ctaLabel?: string
  onCta?: () => void
  ctaDisabled?: boolean
  showWishlist?: boolean
  wishlistActive?: boolean
  onWishlistToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void
  wishlistAriaLabel?: string
  className?: string
}

/**
 * Cinematic book scene — layered depth (atmosphere → book → glass UI), not a card grid.
 * Emotion-first layout: warm / cool cinematic lighting, 3D book hover, floating actions.
 */
export function ImmersiveBookSurface({
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
  wishlistAriaLabel = 'Add to wishlist',
  className = '',
}: ImmersiveBookSurfaceProps) {
  return (
    <section
      className={[
        'group/surface relative isolate min-h-[min(88vh,760px)] w-full overflow-hidden rounded-[2rem]',
        className,
      ].join(' ')}
    >
      {/* —— Layer 1: atmospheric background (depth back) —— */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1a120d] to-[#1c1008]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_20%_30%,rgba(251,146,60,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_85%_75%,rgba(30,58,138,0.22),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.85)_100%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px]" aria-hidden />

      {/* Floating wishlist — own layer, not in the panel row */}
      {showWishlist ? (
        <button
          type="button"
          onClick={onWishlistToggle}
          aria-label={wishlistAriaLabel}
          aria-pressed={wishlistActive}
          className={[
            'absolute right-5 top-5 z-40 flex h-12 w-12 items-center justify-center rounded-full',
            'bg-black/25 text-rose-100/90 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]',
            'backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-black/35 hover:shadow-[0_12px_40px_rgba(244,63,94,0.2)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
            wishlistActive ? 'text-rose-400' : '',
          ].join(' ')}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill={wishlistActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7z" />
          </svg>
        </button>
      ) : null}

      <div className="relative z-10 flex min-h-[min(88vh,760px)] flex-col items-stretch justify-center px-5 pb-10 pt-14 sm:px-8 md:flex-row md:items-center md:gap-4 md:px-10 md:pb-12 md:pt-16 lg:px-14">
        {/* —— Layer 2: book — sharp, dominant, slightly off-axis —— */}
        <div className="relative flex flex-[1.1] justify-center md:justify-start md:pl-2 lg:pl-4">
          <div
            className="relative [perspective:1100px]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className={[
                'relative transition-[transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
                'group-hover/surface:[transform:rotateY(-7deg)_rotateX(4deg)_translateZ(0)]',
                'group-hover/surface:drop-shadow-[0_40px_80px_rgba(0,0,0,0.55)]',
              ].join(' ')}
            >
              {/* Warm rim light behind book */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-lg bg-[radial-gradient(ellipse_at_30%_40%,rgba(251,146,60,0.35),transparent_65%)] opacity-80 blur-2xl"
                aria-hidden
              />
              {image ? (
                <img
                  src={image}
                  alt={imageAlt ?? title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className={[
                    'relative z-10 max-h-[min(52vh,440px)] w-auto max-w-[min(92vw,340px)] object-contain md:max-h-[min(58vh,480px)] md:max-w-[min(42vw,380px)]',
                    'rounded-md rounded-r-lg shadow-[24px_40px_70px_-12px_rgba(0,0,0,0.75),16px_24px_48px_-8px_rgba(0,0,0,0.5),0_0_60px_rgba(251,146,60,0.12)]',
                    'ring-0',
                  ].join(' ')}
                />
              ) : (
                <div
                  className={[
                    'relative z-10 flex h-[min(52vh,440px)] w-[min(72vw,280px)] items-center justify-center rounded-md bg-gradient-to-br from-stone-800 to-stone-950',
                    'shadow-[24px_40px_70px_-12px_rgba(0,0,0,0.75)]',
                  ].join(' ')}
                >
                  <span className="text-6xl opacity-30" aria-hidden>
                    📖
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* —— Layer 3: glass info + action — floating, not a boxed card —— */}
        <div className="relative z-20 mt-10 flex w-full flex-col md:mt-0 md:max-w-md md:flex-[0.95] md:justify-center lg:max-w-lg">
          <div
            className={[
              'relative overflow-hidden rounded-3xl px-6 py-7 sm:px-8 sm:py-8',
              'bg-gradient-to-br from-white/[0.07] to-white/[0.02]',
              'shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]',
              'backdrop-blur-2xl',
            ].join(' ')}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
              aria-hidden
            />

            <div className="relative space-y-3">
              <h2 className="font-serif text-2xl font-semibold leading-[1.15] tracking-tight text-[#faf6f0] sm:text-3xl md:text-[1.75rem] lg:text-[2rem]">
                {title}
              </h2>
              <p className="text-sm font-normal text-stone-400/95">by {author}</p>

              {(genre || condition) && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2 text-[0.8125rem] text-stone-500">
                  {genre ? (
                    <span className="text-amber-200/85">{genre}</span>
                  ) : null}
                  {genre && condition ? (
                    <span className="text-stone-600" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  {condition ? <span>{condition}</span> : null}
                </div>
              )}
            </div>

            {/* Action zone — separated from copy block with air */}
            <div className="relative mt-10 space-y-4 border-t border-white/[0.06] pt-8">
              {(price || availability) && (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  {price ? (
                    <p className="font-serif text-3xl font-semibold tracking-tight text-amber-100/95">{price}</p>
                  ) : (
                    <span />
                  )}
                  {availability ? (
                    <p className="max-w-[14rem] text-right text-[0.75rem] leading-snug text-stone-500">
                      {availability}
                    </p>
                  ) : null}
                </div>
              )}
              <button
                type="button"
                onClick={onCta}
                disabled={ctaDisabled}
                className={[
                  'w-full rounded-2xl py-4 text-[0.9375rem] font-semibold tracking-wide text-stone-950',
                  'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800',
                  'shadow-[0_8px_32px_rgba(251,146,60,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]',
                  'transition duration-300 hover:brightness-105',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                  'disabled:cursor-not-allowed disabled:opacity-45',
                ].join(' ')}
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ImmersiveBookSurface
