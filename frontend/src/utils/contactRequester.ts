/** Opens the system mail client to email a book-request requester (no backend “connection” RPC required). */
export function openContactRequesterEmail(request: {
  requesterEmail: string | null | undefined
  title?: string | null
}): { ok: true } | { ok: false; reason: 'no_email' } {
  const email = request.requesterEmail?.trim()
  if (!email) return { ok: false, reason: 'no_email' }
  const subject = encodeURIComponent(`Re: ${request.title?.trim() || 'Book request'}`)
  window.location.href = `mailto:${email}?subject=${subject}`
  return { ok: true }
}
