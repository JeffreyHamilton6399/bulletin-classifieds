import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { ensureBooted } from '@/lib/ensure-seeded'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export const GET = withDbErrorHandler(async (req: NextRequest) => {
  await ensureBooted()
  const { searchParams } = new URL(req.url)
  const regionId = searchParams.get('regionId')
  const category = searchParams.get('category') // slug
  const subcategory = searchParams.get('subcategory') // slug
  const q = searchParams.get('q')?.trim()
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const hasImage = searchParams.get('hasImage')
  const sort = searchParams.get('sort') || 'recent' // recent | price_asc | price_desc
  const limit = Math.min(parseInt(searchParams.get('limit') || '60', 10), 200)

  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
    expiresAt: { gt: new Date() },
  }

  if (regionId) where.regionId = regionId

  if (category || subcategory) {
    const slug = subcategory || category
    const cat = await db.category.findUnique({ where: { slug } })
    if (cat) {
      // if it's a parent, include all children
      const children = await db.category.findMany({
        where: { parentId: cat.id },
        select: { id: true },
      })
      const ids = [cat.id, ...children.map((c) => c.id)]
      where.categoryId = { in: ids }
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ]
  }

  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = parseInt(minPrice, 10) * 100
    if (maxPrice) where.price.lte = parseInt(maxPrice, 10) * 100
  }

  // hasImage filter handled in post for simplicity with relations
  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy = { price: 'asc' }
  if (sort === 'price_desc') orderBy = { price: 'desc' }

  let listings = await db.listing.findMany({
    where,
    orderBy,
    take: limit * 2, // fetch a bit more for hasImage post-filter
    include: {
      images: { orderBy: { position: 'asc' }, take: 1 },
      category: true,
      region: true,
    },
  })

  if (hasImage === '1') {
    listings = listings.filter((l) => l.images.length > 0)
  }
  listings = listings.slice(0, limit)

  const out = listings.map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    priceLabel: l.priceLabel,
    currency: l.currency,
    locationName: l.locationName,
    lat: l.lat,
    lng: l.lng,
    status: l.status,
    createdAt: l.createdAt,
    expiresAt: l.expiresAt,
    regionId: l.regionId,
    categoryId: l.categoryId,
    _categoryName: l.category.name,
    _categorySlug: l.category.slug,
    _imageCount: l.images.length,
    _thumb: l.images[0]?.url ?? null,
    _regionName: l.region?.name ?? null,
  }))

  return NextResponse.json(out)
})
