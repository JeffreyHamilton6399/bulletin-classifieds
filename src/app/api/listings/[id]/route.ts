import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EXPIRY_DAYS = 30

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureBooted()
  const { id } = await params
  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: 'asc' } },
      category: true,
      region: true,
    },
  })
  if (!listing || listing.status === 'REMOVED') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // increment view count (fire and forget)
  db.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  return NextResponse.json(listing)
}

// Renew a listing (extend expiry). Requires email match for anonymous ownership.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureBooted()
  const { id } = await params
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { action, email } = body
  if (action === 'renew') {
    const listing = await db.listing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (email && listing.contactEmail !== email) {
      return NextResponse.json({ error: 'Email does not match' }, { status: 403 })
    }
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)
    const updated = await db.listing.update({
      where: { id },
      data: { expiresAt, renewedAt: new Date(), status: 'ACTIVE' },
    })
    return NextResponse.json(updated)
  }
  if (action === 'delete') {
    const listing = await db.listing.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (email && listing.contactEmail !== email) {
      return NextResponse.json({ error: 'Email does not match' }, { status: 403 })
    }
    await db.listing.update({ where: { id }, data: { status: 'REMOVED' } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
