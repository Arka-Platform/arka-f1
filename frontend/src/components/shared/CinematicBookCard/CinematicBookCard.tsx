'use client'

import React from 'react'

/** Visual mode: marketplace browse, demand-heavy, or owned-library focus */
export type CinematicBookCardVariant = 'browse' | 'request' | 'library'

/** Maps to primary CTA label + default intent */
export type CinematicBookCardAction = 'get_book' | 'fulfill_request' | 'join_waitlist'

const ACTION_LABELS: Record<CinematicBookCardAction, string> = {
  get_book: 'Get Book',
  fulfill_request: 'Fulfill Request',
  join_waitlist: 'Join Waitlist',
}

const VARIANT_ARTICLE: Record<
  CinematicBookCardVariant,
  { shell: string; hover: string }
> = {
  browse: {
    shell:
      'bg-gradient-to-br from-[#1c1612] via-[#14100d] to-[#0a0807] ring-amber-950/20 shadow-[0_4px_6px_rgba(0,0,0,0.3),0_24px_56px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.04)]',
    hover: 'hover:shadow-[0_12px_32px_rgba(0,0,0,0.5),0_0_48px_rgba(217,119,6,0.1)]',
  },
  request: {
    shell:
      'bg-gradient-to-br from-[#1a1210] via-[#16100f] to-[#0c0808] ring-rose-500/25 shadow-[0_4px_6px_rgba(0,0,0,0.32),0_24px_56px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]',
    hover: 'hover:shadow-[0_12px_36px_rgba(0,0,0,0.52),0_0_52px_rgba(244,63,94,0.14)]',
  },
  library: {
    shell:
      'bg-gradient-to-br from-[#101816] via-[#0e1512] to-[#080a09] ring-emerald-900/35 shadow-[0_4px_6px_rgba(0,0,0,0.28),0_24px_56px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.035)]',
    hover: 'hover:shadow-[0_12px_32px_rgba(0,0,0,0.48),0_0_40px_rgba(16,185,129,0.08)]',
  },
}

const VARIANT_COVER_GLOW: Record<CinematicBookCardVariant, string> = {
  browse: 'bg-[radial-gradient(ellipse_75%_55%_at_50%_32%,rgba(217,119,6,0.11),transparent_58%)]',
  request:
    'bg-[radial-gradient(ellipse_75%_55%_at_50%_32%,rgba(244,63,94,0.14),transparent_55%)]',
  library:
    'bg-[radial-gradient(ellipse_75%_55%_at_50%_32%,rgba(16,185,129,0.1),transparent_58%)]',
}

const VARIANT_STATUS: Record<CinematicBookCardVariant, string> = {
  browse: 'bg-amber-500/[0.09] text-amber-200/75',
  request:
    'bg-rose-500/20 text-rose-100/95 ring-1 ring-rose-400/35 shadow-[0_0_20px_rgba(244,63,94,0.12)]',
  library: 'bg-emerald-500/12 text-emerald-200/85 ring-1 ring-emerald-500/20',
}

const VARIANT_CTA: Record<CinematicBookCardVariant, string> = {
  browse:
    'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-800 text-stone-950 shadow-[0_6px_20px_rgba(217,119,6,0.28),inset_0_1px_0_rgba(255,255,255,0.32)] focus-visible:ring-amber-300/70',
  request:
    'bg-gradient-to-b from-rose-400 via-rose-500 to-rose-900 text-white shadow-[0_6px_22px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] focus-visible:ring-rose-300/75',
  library:
    'bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-950 text-emerald-50 shadow-[0_6px_20px_rgba(16,185,129,0.22),inset_0_1px_0_rgba(255,255,255,0.18)] focus-visible:ring-emerald-400/60',
}

const VARIANT_RING_OFFSET: Record<CinematicBookCardVariant, string> = {
  browse: 'focus-visible:ring-offset-[#14100d]',
  request: 'focus-visible:ring-offset-[#16100f]',
  library: 'focus-visible:ring-offset-[#0e1512]',
}

export interface CinematicBookCardProps {
  title: string
  author: string
  /** Cover URL */
  image?: string | null
  imageAlt?: string
  /** Status pill, e.g. “In Circulation”, “3 Requests”, “Needed this week” */
  status: string
  genre?: string
  /** Short condition line — no ISBN */
  condition?: string
  actionType: CinematicBookCardAction
  /** Override default CTA label */
  actionLabel?: string
  onPrimaryAction?: () => void
  primaryDisabled?: boolean
  /** Secondary: heart only */
  showWishlist?: boolean
  wishlistActive?: boolean
  onWishlistToggle?: (e: React.MouseEvent<HTMLButtonElement>) => void
  wishlistDisabled?: boolean
  wishlistAriaLabel?: string
  /** e.g. “Shared 2 times” or “12 readers have it” */
  footnote?: string
  /** browse: marketplace default · request: demand-forward accents · library: ownership focus */
  variant?: CinematicBookCardVariant
  className?: string
}

/**
 * Premium cinematic book card — dark warm palette, depth, minimal metadata.
 * Tailwind-only; pair with parent that sets width / grid.
 */
export function CinematicBookCard({
  title,
  author,
  image,
  imageAlt,
  status,
  genre,
  condition,
  actionType,
  actionLabel,
  onPrimaryAction,
  primaryDisabled,
  showWishlist = true,
  wishlistActive = false,
  onWishlistToggle,
  wishlistDisabled,
  wishlistAriaLabel = 'Wishlist',
  footnote,
  variant = 'browse',
  className = '',
}: CinematicBookCardProps) {
  const ctaText = actionLabel ?? ACTION_LABELS[actionType]
  const va = VARIANT_ARTICLE[variant]
  const showWishlistResolved = showWishlist ?? variant !== 'library'

  const hasMeta = Boolean(genre || condition)

  return (
    <article
      data-variant={variant}
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] md:rounded-3xl',
        va.shell,
        'ring-1',
        'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1',
        va.hover,
        'backdrop-blur-[2px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {variant === 'request' ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] bg-gradient-to-r from-rose-500 via-rose-400/90 to-amber-500/70 opacity-95"
          aria-hidden
        />
      ) : null}

      {/* Cover — hero (generous inset) */}
      <div className="relative mx-5 mt-6 h-[200px] overflow-hidden rounded-2xl sm:mx-6 sm:mt-7 sm:h-[228px] md:h-[248px] [perspective:880px]">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0807]/88 via-[#0a0807]/5 to-transparent" />
        <div className={`absolute inset-0 z-[1] ${VARIANT_COVER_GLOW[variant]}`} />

        {image ? (
          <img
            src={image}
            alt={imageAlt ?? title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:translateZ(0)] group-hover:scale-[1.04] group-hover:brightness-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950 text-amber-700/35">
            <svg className="h-16 w-16 sm:h-20 sm:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-7 pt-7 md:px-7 md:pb-8 md:pt-8">
        {/* Tier 1: status — quiet label */}
        <div className="shrink-0">
          <span
            className={[
              'inline-flex max-w-full items-center rounded-full px-3.5 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.14em]',
              VARIANT_STATUS[variant],
            ].join(' ')}
            title={status}
          >
            <span className="truncate">{status}</span>
          </span>
        </div>

        {/* Tier 2–3: title + author — clear hierarchy */}
        <div className="mt-5 min-h-0 space-y-2.5">
          <h3 className="line-clamp-2 font-serif text-[1.125rem] font-semibold leading-[1.28] tracking-[-0.02em] text-stone-50 md:text-[1.3125rem]">
            {title}
          </h3>
          <p className="line-clamp-1 text-[0.8125rem] font-normal leading-relaxed text-stone-500">
            by {author}
          </p>
        </div>

        {/* Tier 4: metadata — only when needed, airy */}
        {hasMeta ? (
          <div
            className={[
              'mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t pt-6',
              variant === 'request'
                ? 'border-rose-950/40'
                : variant === 'library'
                  ? 'border-emerald-950/35'
                  : 'border-stone-800/50',
            ].join(' ')}
          >
            {genre ? (
              <span
                className={[
                  'rounded-full px-3 py-1 text-[0.6875rem] font-medium tracking-wide',
                  variant === 'request'
                    ? 'bg-rose-950/35 text-rose-200/85'
                    : variant === 'library'
                      ? 'bg-emerald-950/40 text-emerald-200/80'
                      : 'bg-stone-800/50 text-stone-400',
                ].join(' ')}
              >
                {genre}
              </span>
            ) : null}
            {condition ? (
              <span
                className="max-w-full text-[0.6875rem] leading-snug text-stone-500/95"
                title={condition}
              >
                {condition}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Actions — separated, single focal row */}
        <div
          className={[
            'mt-auto flex items-stretch gap-3',
            hasMeta ? 'pt-8' : 'pt-10',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={primaryDisabled}
            className={[
              'min-h-[48px] flex-1 rounded-[0.875rem] px-5 text-[0.8125rem] font-semibold tracking-wide transition duration-200 hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45',
              VARIANT_CTA[variant],
              VARIANT_RING_OFFSET[variant],
            ].join(' ')}
          >
            {ctaText}
          </button>
          {showWishlistResolved ? (
            <button
              type="button"
              onClick={onWishlistToggle}
              disabled={wishlistDisabled}
              aria-label={wishlistAriaLabel}
              aria-pressed={wishlistActive}
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.875rem] transition duration-200',
                'bg-stone-800/60 text-stone-400',
                'hover:bg-stone-800 hover:text-stone-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2',
                VARIANT_RING_OFFSET[variant],
                wishlistActive ? 'bg-rose-950/40 text-rose-400/95' : '',
                wishlistDisabled ? 'cursor-not-allowed opacity-45' : '',
              ].join(' ')}
            >
              <svg
                className="h-[1.125rem] w-[1.125rem]"
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
        </div>

        {footnote ? (
          <p className="mt-6 border-t border-stone-800/40 pt-5 text-center text-[0.6875rem] font-normal leading-relaxed tracking-wide text-stone-500/75">
            {footnote}
          </p>
        ) : null}
      </div>
    </article>
  )
}

export default CinematicBookCard
