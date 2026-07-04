import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * Wrap an API handler so database errors return a clear, actionable message
 * instead of a generic 500. Helps diagnose setup issues (missing tables,
 * wrong connection string, etc.) without digging through server logs.
 */
export function withDbErrorHandler<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (e: any) {
      const msg = e?.message || String(e)

      // Connection / auth errors
      if (/Can't reach database server|connection|ECONNREFUSED|ENOTFOUND/i.test(msg)) {
        return NextResponse.json(
          { error: 'Cannot connect to the database. Check that DATABASE_URL is set correctly in your environment variables.' },
          { status: 503 },
        )
      }
      // Auth failed
      if (/authentication|password|FATAL/i.test(msg)) {
        return NextResponse.json(
          { error: 'Database authentication failed. Check the username/password in DATABASE_URL.' },
          { status: 503 },
        )
      }
      // Table doesn't exist yet (SQL setup not run)
      if (/relation .* does not exist|no such table|P2021/i.test(msg)) {
        return NextResponse.json(
          { error: 'Database tables not found. Run the supabase-setup.sql file in your Supabase SQL Editor first — see the README.' },
          { status: 503 },
        )
      }
      // Prisma client not generated / wrong provider
      if (/Unknown argument|Prisma Client is not generated/i.test(msg)) {
        return NextResponse.json(
          { error: 'Database client out of date. Run: bunx prisma generate' },
          { status: 500 },
        )
      }
      // Default
      console.error('[API error]', e)
      return NextResponse.json(
        { error: 'Server error: ' + msg.slice(0, 200) },
        { status: 500 },
      )
    }
  }
}
