import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export const GET = withDbErrorHandler(async (req: NextRequest) => {
  const regionId = new URL(req.url).searchParams.get('regionId') || undefined
  const where = regionId
    ? { regionId, status: 'ACTIVE' as const, expiresAt: { gt: new Date() } }
    : { status: 'ACTIVE' as const, expiresAt: { gt: new Date() } }

  // Run counts in parallel. Use try/catch per query so one failure doesn't
  // nuke the whole endpoint — return 0 for any that error.
  const safe = (p: Promise<any>, fallback = 0) => p.catch(() => fallback)

  const [total, withImages, categoryGroups, today] = await Promise.all([
    safe(db.listing.count({ where })),
    safe(db.listing.count({ where: { ...where, images: { some: {} } } })),
    safe(db.listing.groupBy({ by: ['categoryId'], where, _count: true }).then((g) => g.length), 0),
    safe(db.listing.count({
      where: {
        ...where,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })),
  ])

  return NextResponse.json({ total, withImages, categories: categoryGroups, today })
})
