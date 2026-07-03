import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureBooted()
  const regions = await db.region.findMany({
    orderBy: [{ name: 'asc' }],
  })
  return NextResponse.json(regions)
}
