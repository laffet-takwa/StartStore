import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { IS_SUPABASE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/utils/env'

/**
 * Supabase browser client.
 *
 * Supabase Auth is the source of truth for identity: the token it issues is what
 * Django validates, so this client is the session authority for the whole app.
 *
 * Only the publishable/anon key is read here. The service-role key bypasses Row
 * Level Security and must never reach a `VITE_` variable or this bundle.
 */
let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!IS_SUPABASE_CONFIGURED) return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

export function isSupabaseConfigured(): boolean {
  return IS_SUPABASE_CONFIGURED
}

export { IS_SUPABASE_CONFIGURED }
