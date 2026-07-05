import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for image storage. Uses the service role key
 * so uploads bypass RLS (server-only, never exposed to the client).
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL   — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  — the service role key (secret)
 */
let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  client = createClient(url, key, {
    auth: { persistSession: false },
  })
  return client
}

export const SUPABASE_BUCKET = 'listings'
