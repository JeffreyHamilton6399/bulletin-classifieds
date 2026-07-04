import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await ensureBooted()
  const regionId = new URL(req.url).searchParams.get('regionId') || undefined
  const where = regionId
    ? { regionId, status: 'ACTIVE' as const, expiresAt: { gt: new Date() } }
    : { status: 'ACTIVE' as const, expiresAt: { gt: new Date() } }

  const [total, withImages, categories, today] = await Promise.all([
    db.listing.count({ where }),
    db.listing.count({ where: { ...where, images: { some: {} } } }),
    db.listing
      .groupBy({ by: ['categoryId'], where, _count: true })
      .then((g) => g.length),
    db.listing.count({
      where: {
        ...where,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return NextResponse.json({ total, withImages, categories, today })
}
