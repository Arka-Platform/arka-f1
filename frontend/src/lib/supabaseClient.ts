import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabaseClientLike = SupabaseClient<any>

// Keep module evaluation safe during `next build` / prerender.
// If env vars are missing, we expose a client that throws only when actually used.
function createMissingEnvClient(): SupabaseClientLike {
  const message = [
    'Missing required Supabase environment variables.',
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  ].join(' ')

  return new Proxy(
    {},
    {
      get() {
        throw new Error(message)
      },
    }
  ) as unknown as SupabaseClientLike
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClientLike = (() => {
  if (!supabaseUrl || !supabaseKey) return createMissingEnvClient()
  const url: string = supabaseUrl
  const key: string = supabaseKey
  return createClient<any>(url, key)
})()
