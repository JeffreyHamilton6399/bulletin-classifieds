/**
 * Previously copied a seed SQLite DB to /tmp on Vercel. Now that we use
 * Supabase Postgres, persistence is handled by the database itself — no
 * boot step needed. Kept as a no-op so existing API routes don't break.
 */
export async function ensureBooted() {
  // no-op — Postgres persists across serverless invocations
}

export const ensureSeeded = ensureBooted
