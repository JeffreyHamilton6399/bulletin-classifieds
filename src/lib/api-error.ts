import { NextResponse } from 'next/server'

/**
 * Wrap an API handler so database errors return a clear, actionable message
 * instead of a generic 500. Includes the actual error code/message so issues
 * can be diagnosed from the browser console without digging through logs.
 */
export function withDbErrorHandler<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (e: any) {
      // Log the full error server-side
      console.error('[API DB error]', JSON.stringify({
        message: e?.message,
        code: e?.code,
        meta: e?.meta,
      }))

      const msg = e?.message || String(e)
      const code = e?.code || ''

      // DATABASE_URL not set at all
      if (!process.env.DATABASE_URL || /Environment variable not found/i.test(msg)) {
        return NextResponse.json(
          {
            error: 'DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables. Use the Supabase Transaction pooler connection string (port 6543).',
            code: 'NO_DATABASE_URL',
          },
          { status: 503 },
        )
      }

      // Connection / auth errors
      if (/Can't reach database server|ECONNREFUSED|ENETUNREACH|ENOTFOUND|Timed out/i.test(msg)) {
        return NextResponse.json(
          {
            error: `Cannot reach the database (${code}). If deploying on Vercel, use the Supabase Transaction pooler URL (port 6543) with ?pgbouncer=true — the direct connection (port 5432) may not work from serverless.`,
            code: 'DB_UNREACHABLE',
          },
          { status: 503 },
        )
      }
      // Auth failed
      if (/authentication|password|FATAL|28P01/i.test(msg)) {
        return NextResponse.json(
          {
            error: `Database authentication failed (${code}). Check the password in your DATABASE_URL.`,
            code: 'DB_AUTH_FAILED',
          },
          { status: 503 },
        )
      }
      // Table doesn't exist yet (SQL setup not run)
      if (/relation .* does not exist|no such table|P2021|42P01/i.test(msg)) {
        return NextResponse.json(
          {
            error: 'Database tables not found. Run supabase-setup.sql in your Supabase SQL Editor — see the README.',
            code: 'TABLES_MISSING',
          },
          { status: 503 },
        )
      }

      // Default — include the full error for diagnosis
      return NextResponse.json(
        { error: `Database error (${code}): ${msg.slice(0, 300)}`, code: 'DB_ERROR' },
        { status: 500 },
      )
    }
  }
}
