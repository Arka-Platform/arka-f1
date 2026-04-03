import type { TrustScoreResponse } from './api'

export function formatSuccessRateLabel(returnRatePercent: number): string {
  const safe = Number.isFinite(returnRatePercent) ? returnRatePercent : 0
  const n = Math.round(safe * 100) / 100
  const display = Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '')
  return `${display}% Return Rate`
}

export function formatActivityLabel(booksShared: number): string {
  if (booksShared >= 50) return '50+ Books Shared'
  if (booksShared <= 0) return 'Books Shared: getting started'
  if (booksShared === 1) return '1 Book Shared'
  return `${booksShared} Books Shared`
}

export function formatResponseTimeLabel(avgHours: number | null, samples: number): string {
  if (samples <= 0 || avgHours == null || !Number.isFinite(avgHours)) {
    return 'Response time: building profile'
  }
  if (avgHours < 1) return 'Replies in <1 hr'
  if (avgHours < 6) return 'Replies in <6 hrs'
  if (avgHours < 24) return 'Replies in <24 hrs'
  if (avgHours < 48) return 'Replies in <48 hrs'
  return `Replies in ~${Math.round(avgHours)} hrs`
}

export function formatTrustMetrics(t: TrustScoreResponse): {
  successRate: string
  activity: string
  responseTime: string
} {
  return {
    successRate: formatSuccessRateLabel(t.returnRatePercent),
    activity: formatActivityLabel(t.booksSharedCount),
    responseTime: formatResponseTimeLabel(t.avgResponseHours, t.responseSamples),
  }
}
