import { supabase } from '../lib/supabaseClient'

type SupabaseUserLike = {
  id?: string | null
  email?: string | null
  phone?: string | null
  user_metadata?: Record<string, unknown> | null
}

// By requirement: use `public.users` as the canonical "profile" row.
// Table name can be overridden per environment.
const USERS_TABLE =
  (import.meta.env.VITE_SUPABASE_USERS_TABLE as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PROFILE_TABLE as string | undefined) ??
  'users'

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

function safeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Ensure a Supabase public user row exists for the given auth user.
 *
 * Idempotency:
 * - Uses an existence check (defensive "do not insert if user already exists")
 * - Uses UPSERT with `onConflict: 'id'` to be safe under races / repeated logins
 *
 * Robustness:
 * - Attempts a "full" upsert, but falls back to minimal payloads if schema/RLS differs
 * - Never throws on failure; profile sync is best-effort
 */
export async function syncSupabasePublicUser(user: SupabaseUserLike | null | undefined): Promise<void> {
  if (!user) return
  const userId = user.id ?? null
  if (!userId) return

  const email = user.email ?? null
  const phone = user.phone ?? null
  const metadata = toRecord(user.user_metadata)

  // Try to avoid writes when the row already exists.
  // If this select is blocked by RLS, we'll fall back to upsert.
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[supabaseProfileSync] select failed; will attempt upsert', {
        table: USERS_TABLE,
        userId,
        error,
      })
    } else if (data?.id) {
      return
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[supabaseProfileSync] select threw; will attempt upsert', { table: USERS_TABLE, userId, err })
  }

  // Prefer auth.users as source of truth; only copy from metadata where available.
  const fullPayload: Record<string, unknown> = {
    id: userId,
    ...(email ? { email } : {}),
    ...(safeString(metadata.first_name) ? { first_name: safeString(metadata.first_name) } : {}),
    ...(safeString(metadata.last_name) ? { last_name: safeString(metadata.last_name) } : {}),
    ...(phone ? { phone } : {}),
    ...(safeString(metadata.avatar) ? { avatar_url: safeString(metadata.avatar) } : {}),
    ...(safeString(metadata.avatar_url) ? { avatar_url: safeString(metadata.avatar_url) } : {}),
  }

  const minimalPayload: Record<string, unknown> = {
    id: userId,
    ...(email ? { email } : {}),
  }

  const attemptUpsert = async (payload: Record<string, unknown>, attemptLabel: string) => {
    const { error } = await supabase
      .from(USERS_TABLE)
      .upsert(payload, { onConflict: 'id' })

    if (error) {
      throw error
    }

    // eslint-disable-next-line no-console
    console.info('[supabaseProfileSync] public user upserted', { table: USERS_TABLE, attemptLabel, userId })
  }

  // Best-effort sync: never break login UX.
  try {
    await attemptUpsert(fullPayload, 'full')
  } catch (error1) {
    // eslint-disable-next-line no-console
    console.error('[supabaseProfileSync] full upsert failed; attempting minimal', { table: USERS_TABLE, userId, error1 })
    try {
      await attemptUpsert(minimalPayload, 'minimal')
    } catch (error2) {
      // eslint-disable-next-line no-console
      console.error('[supabaseProfileSync] minimal upsert failed; giving up', { table: USERS_TABLE, userId, error2 })
    }
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

