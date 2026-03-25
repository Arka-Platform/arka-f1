import { createClient } from '@supabase/supabase-js'

import { getEnv } from './env'

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseKey) {
  // Avoid Next.js build-time crashes when env isn't injected yet.
  // On the real runtime (browser), we keep the same failure mode.
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables')
  }
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseKey || 'public-anon-key')
