import { createClient } from '@supabase/supabase-js'

import { getEnv } from './env'

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

let hasLoggedMissingEnv = false

if (!supabaseUrl || !supabaseKey) {
  if (!hasLoggedMissingEnv) {
    hasLoggedMissingEnv = true
    // Do NOT log secret values. Only log presence and context.
    // This is intentionally noisy only when misconfigured.
    // Helpful on Vercel because NEXT_PUBLIC_* is inlined at build time.
    // eslint-disable-next-line no-console
    console.error('[supabaseClient] Missing NEXT_PUBLIC Supabase env vars', {
      runtime: typeof window === 'undefined' ? 'server' : 'client',
      nodeEnv: process.env.NODE_ENV,
      hasNextPublicSupabaseUrl: Boolean(supabaseUrl),
      hasNextPublicSupabaseAnonKey: Boolean(supabaseKey),
    })
  }

  // Avoid Next.js build-time crashes when env isn't injected yet.
  // On the real runtime (browser), we keep the same failure mode.
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables')
  }
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseKey || 'public-anon-key')
