const OTP_COOLDOWN_MS = 60_000

function key(channel: 'email' | 'phone', value: string): string {
  return `otp:last_sent:${channel}:${value.trim().toLowerCase()}`
}

export function getOtpCooldownRemainingSeconds(channel: 'email' | 'phone', value: string): number {
  if (!value.trim()) return 0
  const raw = window.localStorage.getItem(key(channel, value))
  if (!raw) return 0
  const lastSentMs = Number(raw)
  if (!Number.isFinite(lastSentMs)) return 0
  const remaining = OTP_COOLDOWN_MS - (Date.now() - lastSentMs)
  if (remaining <= 0) return 0
  return Math.ceil(remaining / 1000)
}

export function markOtpSentNow(channel: 'email' | 'phone', value: string): void {
  if (!value.trim()) return
  window.localStorage.setItem(key(channel, value), String(Date.now()))
}
