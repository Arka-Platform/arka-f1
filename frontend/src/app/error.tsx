'use client'

import { useEffect } from 'react'

function looksLikeBackendMisconfig(message: string) {
  const m = message.toLowerCase()
  return (
    m.includes('relation') && m.includes('does not exist') ||
    m.includes('function') && m.includes('does not exist') ||
    m.includes('rpc') && m.includes('not found') ||
    m.includes('missing next_public_supabase_') ||
    m.includes('missing required supabase environment variables')
  )
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app/error] Unhandled error', error)
  }, [error])

  const message = error?.message || 'Unknown error'
  const backendMisconfig = looksLikeBackendMisconfig(message)

  return (
    <html lang="en">
      <body>
        <div style={{ padding: 24, maxWidth: 920, margin: '0 auto' }}>
          <h2 style={{ margin: 0 }}>Application error</h2>
          <p style={{ color: '#666', marginTop: 8 }}>
            {backendMisconfig
              ? 'The app is running, but the backend configuration/schema looks incomplete.'
              : 'An unexpected error occurred.'}
          </p>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.12)',
              background: 'rgba(0,0,0,0.02)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message}
          </div>

          {backendMisconfig ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 8 }}>What to verify</h3>
              <ul style={{ marginTop: 0, color: '#333' }}>
                <li>
                  Supabase migrations applied (tables/RPCs exist): `books`, `book_listings`, `inventory_books`, `listing_images`,
                  `record_user_event`, and recycling table `waste_paper`.
                </li>
                <li>
                  Env vars present on Vercel (and Preview/Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
                  `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (should match the created bucket, typically `books-images`).
                </li>
              </ul>
            </div>
          ) : null}

          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.18)',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.18)',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

