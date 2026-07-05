import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Diagnostic endpoint — shows exactly what's happening with the DB connection
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '(not set)'
  // mask the password
  const masked = dbUrl.replace(/(:[^:@]+@)/, ':***@')
  
  const info: any = {
    urlPresent: !!process.env.DATABASE_URL,
    urlMasked: masked,
    urlPort: dbUrl.match(/:(\d+)\//)?.[1] || 'unknown',
    urlHasPgbouncer: dbUrl.includes('pgbouncer=true'),
    urlHost: dbUrl.match(/@([^:/]+)/)?.[1] || 'unknown',
    vercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    const count = await db.region.count()
    info.status = 'CONNECTED'
    info.regionCount = count
    return NextResponse.json(info)
  } catch (e: any) {
    info.status = 'FAILED'
    info.error = e?.message
    info.errorCode = e?.code
    info.errorMeta = e?.meta
    return NextResponse.json(info, { status: 500 })
  }
}
