import { NextResponse } from 'next/server'

/**
 * Wrap an API handler so database errors return a clear, actionable message.
 * Detects common Vercel + Supabase misconfigurations and gives specific fixes.
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
      const dbUrl = process.env.DATABASE_URL || ''

      // Analyze the DATABASE_URL to detect common mistakes
      let urlHint = ''
      if (dbUrl) {
        if (dbUrl.includes(':5432')) {
          urlHint = 'Your DATABASE_URL uses port 5432 (direct connection). Vercel serverless CANNOT reach this — you must use the Transaction pooler (port 6543) instead. Go to Supabase → Settings → Database → Connection string → "Transaction pooler" tab.'
        } else if (dbUrl.includes(':6543')) {
          urlHint = 'Your DATABASE_URL uses port 6543 (correct pooler), but the connection still failed. Check: (1) the region in the hostname is correct for your project, (2) the password is right, (3) you added ?pgbouncer=true to the URL.'
        } else if (dbUrl.startsWith('file:')) {
          urlHint = 'Your DATABASE_URL is still a SQLite file path! Change it to your Supabase Postgres connection string.'
        }
      }

      // DATABASE_URL not set at all
      if (!dbUrl || /Environment variable not found/i.test(msg)) {
        return NextResponse.json(
          {
            error: 'DATABASE_URL is not set on Vercel. Go to Vercel → Settings → Environment Variables and add it. Use the Supabase Transaction pooler URL (port 6543).',
            code: 'NO_DATABASE_URL',
          },
          { status: 503 },
        )
      }

      // Connection errors
      if (/Can't reach database server|ECONNREFUSED|ENETUNREACH|ENOTFOUND|Timed out|connect ETIMEDOUT/i.test(msg)) {
        return NextResponse.json(
          {
            error: `Cannot reach the database. ${urlHint}`,
            code: 'DB_UNREACHABLE',
            urlUsesPort5432: dbUrl.includes(':5432'),
            urlUsesPort6543: dbUrl.includes(':6543'),
          },
          { status: 503 },
        )
      }
      // Auth failed
      if (/authentication|password|FATAL|28P01/i.test(msg)) {
        return NextResponse.json(
          {
            error: `Database authentication failed. The password in your DATABASE_URL is wrong. Reset it in Supabase → Settings → Database → Reset password, then update the DATABASE_URL env var on Vercel.`,
            code: 'DB_AUTH_FAILED',
          },
          { status: 503 },
        )
      }
      // Table doesn't exist yet
      if (/relation .* does not exist|no such table|P2021|42P01/i.test(msg)) {
        return NextResponse.json(
          {
            error: 'Database connected, but tables are missing. Run supabase-setup.sql in your Supabase SQL Editor.',
            code: 'TABLES_MISSING',
          },
          { status: 503 },
        )
      }

      // Default
      return NextResponse.json(
        { error: `Database error (${code}): ${msg.slice(0, 300)}`, code: 'DB_ERROR' },
        { status: 500 },
      )
    }
  }
}
