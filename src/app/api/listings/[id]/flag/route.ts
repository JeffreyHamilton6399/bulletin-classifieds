import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const VALID_REASONS = ['PROHIBITED', 'MISCATEGORIZED', 'SPAM', 'SCAM', 'DUPLICATE', 'OTHER']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const reason = String(body.reason || '').toUpperCase()
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })
  }

  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // simple ip-based dedup / rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)

  const existing = await db.flag.findFirst({
    where: { listingId: id, ipHash },
  })
  if (existing) {
    return NextResponse.json({ ok: true, already: true })
  }

  await db.flag.create({ data: { listingId: id, reason: reason as any, ipHash } })

  // auto-remove after threshold
  const count = await db.flag.count({ where: { listingId: id } })
  if (count >= 5) {
    await db.listing.update({ where: { id }, data: { status: 'REMOVED' } })
    return NextResponse.json({ ok: true, removed: true })
  }
  return NextResponse.json({ ok: true, count })
}
