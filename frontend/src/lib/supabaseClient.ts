import { createClient } from '@supabase/supabase-js'

// ✅ Direct static access (required for Next.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Fail fast: the app cannot function without Supabase credentials.
  // Do not log secret values.
  throw new Error(
    [
      'Missing required Supabase environment variables.',
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    ].join(' ')
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
