import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
  const { fromEmail, fromName, body: text } = body

  if (!fromEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!text || text.trim().length < 5) {
    return NextResponse.json({ error: 'Message too short' }, { status: 400 })
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const listing = await db.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // rate limit: 3 messages per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recent = await db.message.count({
    where: { fromEmail, createdAt: { gt: oneHourAgo } },
  })
  if (recent >= 3) {
    return NextResponse.json({ error: 'Rate limit reached. Try again later.' }, { status: 429 })
  }

  const msg = await db.message.create({
    data: {
      listingId: id,
      fromEmail: fromEmail.trim(),
      fromName: fromName?.trim() || null,
      body: text.trim(),
    },
  })
  return NextResponse.json(msg, { status: 201 })
}
