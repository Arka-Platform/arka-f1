import React, { useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../../contexts/ToastContext'
import type { Session } from '@supabase/supabase-js'

async function waitForSession(timeoutMs: number, intervalMs: number): Promise<Session | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.auth.getSession()
    if (data.session) return data.session
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return null
}

const OAuthCallback: React.FC = () => {
  const router = useRouter()
  const { error: showError } = useToast()
  const searchParams = useSearchParams()
  const handledRef = useRef(false)

  const nextPath = useMemo(() => {
    const raw = searchParams.get('next')
    const fallback = '/home'
    if (!raw) return fallback
    // Prevent open redirects and accidental loops.
    if (!raw.startsWith('/')) return fallback
    if (raw.startsWith('/auth/callback')) return fallback
    // Keep it simple: only allow internal app routes.
    const allowed = new Set(['/home', '/account', '/exchange', '/requests', '/wishlist'])
    return allowed.has(raw) ? raw : fallback
  }, [searchParams])

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true
    void handle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handle = async () => {
    // If Supabase redirected back with an error, show it and stop.
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const oauthError = error ? `${error}${errorDescription ? `: ${errorDescription}` : ''}` : null

    if (oauthError) {
      // eslint-disable-next-line no-console
      console.error('[OAuthCallback] Supabase OAuth error', { oauthError })
      showError('Google login failed. Please try again.')
      router.replace('/login')
      return
    }

    try {
      const session = await waitForSession(8000, 250)
      if (!session?.user?.id) {
        showError('Login session was not established. Please try again.')
        router.replace('/login')
        return
      }

      // If we already have a valid session, proceed. `AuthContext` will do idempotent upserts.
      router.replace(nextPath)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[OAuthCallback] Failed to finalize OAuth session', err)
      showError('Authentication failed. Please try again.')
      router.replace('/login')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Signing you in...</h2>
      <p>Finalizing Google login securely.</p>
    </div>
  )
}

export default OAuthCallback

