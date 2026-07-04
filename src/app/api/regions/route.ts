import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export const GET = withDbErrorHandler(async () => {
  await ensureBooted()
  const regions = await db.region.findMany({
    orderBy: [{ name: 'asc' }],
  })
  return NextResponse.json(regions)
})
