import { createClient } from '@supabase/supabase-js'

// ✅ Direct static access (required for Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let hasLoggedMissingEnv = false

if (!supabaseUrl || !supabaseKey) {
  if (!hasLoggedMissingEnv) {
    hasLoggedMissingEnv = true

    // Log only metadata, never actual secrets
    // eslint-disable-next-line no-console
    console.error('[supabaseClient] Missing NEXT_PUBLIC Supabase env vars', {
      runtime: typeof window === 'undefined' ? 'server' : 'client',
      nodeEnv: process.env.NODE_ENV,
      hasNextPublicSupabaseUrl: Boolean(supabaseUrl),
      hasNextPublicSupabaseAnonKey: Boolean(supabaseKey),
    })
  }

  // Throw only in browser (prevents build-time crash)
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables')
  }
}

// ✅ Safe fallback only for build-time (never used in real prod if env is correct)
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'public-anon-key'
)
