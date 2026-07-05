import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export const POST = withDbErrorHandler(async (req: NextRequest) => {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const tokens: string[] = Array.isArray(body?.tokens) ? body.tokens : []
  if (tokens.length === 0) return NextResponse.json([])
  const safe = tokens.filter((t) => typeof t === 'string').slice(0, 200)

  const listings = await db.listing.findMany({
    where: { editToken: { in: safe } },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      category: true,
      region: true,
    },
    take: 200,
  })

  const out = listings.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    priceLabel: l.priceLabel,
    locationName: l.locationName,
    status: l.status,
    createdAt: l.createdAt,
    expiresAt: l.expiresAt,
    viewCount: l.viewCount,
    editToken: l.editToken,
    categoryId: l.categoryId,
    regionId: l.regionId,
    _categoryName: l.category.name,
    _regionName: l.region?.name ?? null,
    _thumb: l.images[0]?.url ?? null,
  }))
  return NextResponse.json(out)
})
