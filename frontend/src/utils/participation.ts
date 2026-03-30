/**
 * Participation / balance gating (offer_count - take_count).
 *
 * Env (public, client-safe):
 *   NEXT_PUBLIC_PARTICIPATION_WARNING_THRESHOLD   — e.g. -1
 *   NEXT_PUBLIC_PARTICIPATION_RESTRICTION_THRESHOLD — e.g. -3
 *
 * Must satisfy: RESTRICTION_THRESHOLD < WARNING_THRESHOLD (e.g. -3 < -1).
 */

export type ParticipationState = 'ALLOW' | 'WARN' | 'RESTRICT'

export type ParticipationUser = {
  offerCount: number
  takeCount: number
}

function parseThreshold(name: string, fallback: number): number {
  if (typeof process === 'undefined' || !process.env) return fallback
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

let validated = false

/** Defaults: warn when balance at -1, restrict at -3 or below. */
const DEFAULT_WARNING = -1
const DEFAULT_RESTRICTION = -3

export function getParticipationWarningThreshold(): number {
  return parseThreshold('NEXT_PUBLIC_PARTICIPATION_WARNING_THRESHOLD', DEFAULT_WARNING)
}

export function getParticipationRestrictionThreshold(): number {
  return parseThreshold('NEXT_PUBLIC_PARTICIPATION_RESTRICTION_THRESHOLD', DEFAULT_RESTRICTION)
}

function ensureThresholdOrdering(): void {
  if (validated) return
  const w = getParticipationWarningThreshold()
  const r = getParticipationRestrictionThreshold()
  if (!(r < w)) {
    throw new Error(
      `[participation] NEXT_PUBLIC_PARTICIPATION_RESTRICTION_THRESHOLD (${r}) must be < NEXT_PUBLIC_PARTICIPATION_WARNING_THRESHOLD (${w})`
    )
  }
  validated = true
}

/**
 * balance = offer_count - take_count
 *
 * IF balance >= 0 → ALLOW
 * ELSE IF balance <= RESTRICTION_THRESHOLD → RESTRICT
 * ELSE IF balance <= WARNING_THRESHOLD → WARN
 * ELSE → ALLOW
 */
export function getParticipationState(user: ParticipationUser): ParticipationState {
  ensureThresholdOrdering()
  const balance = user.offerCount - user.takeCount
  const warningThreshold = getParticipationWarningThreshold()
  const restrictionThreshold = getParticipationRestrictionThreshold()

  if (balance >= 0) return 'ALLOW'
  if (balance <= restrictionThreshold) return 'RESTRICT'
  if (balance <= warningThreshold) return 'WARN'
  return 'ALLOW'
}

export function getParticipationBalance(user: ParticipationUser): number {
  return user.offerCount - user.takeCount
}
