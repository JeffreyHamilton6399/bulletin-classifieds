import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureBooted()
  const { id } = await params
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarColor: true,
      createdAt: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const listings = await db.listing.findMany({
    where: { userId: id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      category: true,
    },
    take: 100,
  })

  const out = listings.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    priceLabel: l.priceLabel,
    locationName: l.locationName,
    createdAt: l.createdAt,
    _categoryName: l.category.name,
    _thumb: l.images[0]?.url ?? null,
  }))

  return NextResponse.json({ user, listings: out })
}
