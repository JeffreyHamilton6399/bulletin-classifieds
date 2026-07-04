import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PATCH own profile (bio + name)
export async function PATCH(req: NextRequest) {
  await ensureBooted()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const bio = String(body.bio || '').trim().slice(0, 500)
  const name = String(body.name || '').trim().slice(0, 60)

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { bio: bio || null, name: name || undefined },
    select: { id: true, name: true, bio: true, avatarColor: true, email: true },
  })
  return NextResponse.json(updated)
}

// GET the logged-in user's full profile + all their listings (any status)
export async function GET() {
  await ensureBooted()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, bio: true, avatarColor: true, createdAt: true,
    },
  })
  const listings = await db.listing.findMany({
    where: { userId: session.user.id },
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
    editToken: l.editToken,
    _categoryName: l.category.name,
    _regionName: l.region?.name ?? null,
    _thumb: l.images[0]?.url ?? null,
  }))
  return NextResponse.json({ user, listings: out })
}
