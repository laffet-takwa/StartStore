/**
 * Runtime configuration, read once from Vite's env replacement.
 *
 * Only `VITE_`-prefixed variables reach the browser bundle, which is exactly why
 * the Supabase service-role key must never be given that prefix.
 */
function env(key: string, fallback = ''): string {
  const value = (import.meta.env as Record<string, string | undefined>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

/** Base URL of the Django REST API, without a trailing slash. */
export const API_URL = env('VITE_API_URL', 'http://127.0.0.1:8000/api').replace(/\/+$/, '')

export const SUPABASE_URL = env('VITE_SUPABASE_URL')

/**
 * The publishable (legacy: anon) key. `VITE_SUPABASE_ANON_KEY` is the documented
 * name; the newer `VITE_SUPABASE_PUBLISHABLE_KEY` is accepted as an alias.
 */
export const SUPABASE_ANON_KEY = env(
  'VITE_SUPABASE_ANON_KEY',
  env('VITE_SUPABASE_PUBLISHABLE_KEY'),
)

export const STORE_NAME = env('VITE_STORE_NAME', 'StartStore')
export const CURRENCY = env('VITE_CURRENCY', 'USD')
export const LOCALE = 'en-US'

export const IS_DEV = import.meta.env.DEV

/** Guard for the Supabase client: is it configured at all? */
export const IS_SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
