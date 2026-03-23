import { supabase } from '../lib/supabaseClient'

type SupabaseUserLike = {
  id?: string | null
}

// By requirement: use `public.users` as the canonical "profile" row.
// Table name can be overridden per environment.
const USERS_TABLE =
  (import.meta.env.VITE_SUPABASE_USERS_TABLE as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PROFILE_TABLE as string | undefined) ??
  'users'

/**
 * Ensure a Supabase public user row exists for the given auth user.
 *
 * Idempotency:
 * - Delegates to DB-side `ensure_user_profile()` (ON CONFLICT protected)
 *
 * Robustness:
 * - Never throws on failure; bootstrap remains best-effort
 */
export async function syncSupabasePublicUser(user: SupabaseUserLike | null | undefined): Promise<void> {
  if (!user) return
  const userId = user.id ?? null
  if (!userId) return

  // Server-side trigger + RPC are the source of truth for profile writes.
  // Keep frontend behavior to a lightweight bootstrap call only.
  try {
    const { error: ensureError } = await supabase.rpc('ensure_user_profile')
    if (ensureError) {
      // eslint-disable-next-line no-console
      console.warn('[supabaseProfileSync] ensure_user_profile rpc failed; continuing', { userId, ensureError })
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[supabaseProfileSync] ensure_user_profile rpc threw; continuing', { userId, err })
  }
}

type PublicUserRow = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  is_admin?: boolean | null
  credit_balance?: number | string | null
}

/**
 * Best-effort fetch of the public user row for hydration.
 * - Never throws
 * - Never blocks login UX
 */
export async function fetchSupabasePublicUserById(userId: string): Promise<PublicUserRow | null> {
  if (!userId) return null
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('[supabaseProfileSync] fetch public user failed', { table: USERS_TABLE, userId, error })
      return null
    }

    return (data as PublicUserRow) ?? null
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[supabaseProfileSync] fetch public user threw', { table: USERS_TABLE, userId, err })
    return null
  }
}

