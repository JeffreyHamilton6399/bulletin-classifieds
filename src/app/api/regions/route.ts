import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const regions = await db.region.findMany({
    orderBy: [{ name: 'asc' }],
  })
  return NextResponse.json(regions)
}
