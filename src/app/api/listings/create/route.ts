import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withDbErrorHandler } from '@/lib/api-error'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const EXPIRY_DAYS = 30

export const POST = withDbErrorHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    title,
    description,
    price, // dollars number | null
    priceLabel,
    locationName,
    lat,
    lng,
    regionId,
    categoryId,
    contactEmail,
    contactName,
    contactPhone,
    showPhone,
    images, // string[] urls
  } = body

  if (!title || title.trim().length < 4) {
    return NextResponse.json({ error: 'Title must be at least 4 characters' }, { status: 400 })
  }
  if (!description || description.trim().length < 10) {
    return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 })
  }
  if (!regionId) return NextResponse.json({ error: 'Region is required' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
  if (!contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    return NextResponse.json({ error: 'Valid contact email is required' }, { status: 400 })
  }

  const region = await db.region.findUnique({ where: { id: regionId } })
  if (!region) return NextResponse.json({ error: 'Invalid region' }, { status: 400 })
  const category = await db.category.findUnique({ where: { id: categoryId } })
  if (!category) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })

  const priceCents =
    price === null || price === undefined || price === ''
      ? null
      : Math.round(Number(price) * 100)
  if (priceCents !== null && (isNaN(priceCents) || priceCents < 0)) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }

  const imgList = Array.isArray(images) ? images.slice(0, 12) : []

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS)

  // rate limit: max 5 listings per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recent = await db.listing.count({
    where: { contactEmail, createdAt: { gt: oneHourAgo } },
  })
  if (recent >= 5) {
    return NextResponse.json(
      { error: 'Rate limit: too many posts from this email. Try again later.' },
      { status: 429 },
    )
  }

  try {
    // Verify the session user still exists in the DB. On serverless, the DB
    // can reset per cold start while the browser JWT persists — a "ghost"
    // session pointing to a nonexistent user would violate the FK constraint.
    let userId: string | null = null
    if (session?.user?.id) {
      const u = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
      if (u) userId = u.id
    }

    // Generate a strong, unique management token. This acts as the listing's
    // "key" — whoever holds it can renew/delete. Stored in the poster's
    // browser so only they (or anyone they share the link with) can manage.
    const editToken = crypto.randomBytes(18).toString('base64url')
    const listing = await db.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: priceCents,
        priceLabel: priceLabel?.trim() || null,
        locationName: locationName?.trim() || region.name,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        regionId,
        categoryId,
        contactEmail: contactEmail.trim(),
        contactName: contactName?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        showPhone: !!showPhone,
        editToken,
        expiresAt,
        userId,
        images:
          imgList.length > 0
            ? {
                create: imgList.map((url: string, i: number) => ({
                  url,
                  position: i,
                })),
              }
            : undefined,
      },
      include: { images: { orderBy: { position: 'asc' } }, category: true, region: true },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (e) {
    // re-throw — withDbErrorHandler catches and formats it
    throw e
  }
})
