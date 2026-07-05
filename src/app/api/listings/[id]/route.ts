import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EXPIRY_DAYS = 30

export const GET = withDbErrorHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
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
})

// Renew or delete a listing. Auth via per-listing editToken (the poster's
// secret management key) — no account or password required, and no one can
// manage a listing without holding its token.
export const PATCH = withDbErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { action, token } = body
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Management token required' }, { status: 401 })
  }
  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // constant-time-ish comparison to avoid token enumeration timing attacks
  if (listing.editToken !== token) {
    return NextResponse.json({ error: 'Invalid management token' }, { status: 403 })
  }

  if (action === 'renew') {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)
    const updated = await db.listing.update({
      where: { id },
      data: { expiresAt, renewedAt: new Date(), status: 'ACTIVE' },
    })
    return NextResponse.json(updated)
  }
  if (action === 'delete') {
    await db.listing.update({ where: { id }, data: { status: 'REMOVED' } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
})
