import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'

export const dynamic = 'force-dynamic'

// GET listings owned by an email (for the "manage your listings" flow)
export async function GET(req: NextRequest) {
  await ensureBooted()
  const email = new URL(req.url).searchParams.get('email')?.trim().toLowerCase()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  const listings = await db.listing.findMany({
    where: { contactEmail: email },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      category: true,
      region: true,
    },
    take: 100,
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
    categoryId: l.categoryId,
    regionId: l.regionId,
    _categoryName: l.category.name,
    _regionName: l.region?.name ?? null,
    _thumb: l.images[0]?.url ?? null,
  }))
  return NextResponse.json(out)
}
