// Shared client/server types mirroring the Prisma models (serializable)

export type Status = 'ACTIVE' | 'EXPIRED' | 'REMOVED' | 'DRAFT'
export type FlagReason =
  | 'PROHIBITED'
  | 'MISCATEGORIZED'
  | 'SPAM'
  | 'SCAM'
  | 'DUPLICATE'
  | 'OTHER'

export interface RegionT {
  id: string
  name: string
  slug: string
  state: string
  lat: number
  lng: number
  radiusKm: number
}

export interface CategoryT {
  id: string
  name: string
  slug: string
  parentId: string | null
  icon: string | null
  sortOrder: number
  children?: CategoryT[]
}

export interface ImageT {
  id: string
  url: string
  position: number
  width: number | null
  height: number | null
}

export interface ListingT {
  id: string
  title: string
  description: string
  price: number | null // cents
  priceLabel: string | null
  currency: string
  locationName: string
  lat: number | null
  lng: number | null
  contactEmail: string
  contactName: string | null
  contactPhone: string | null
  showPhone: boolean
  editToken?: string // only present on the create response + my-listings
  status: Status
  expiresAt: string
  renewedAt: string
  viewCount: number
  createdAt: string
  updatedAt: string
  regionId: string
  categoryId: string
  region?: RegionT
  category?: CategoryT
  images: ImageT[]
  _imageCount?: number
  _categoryName?: string
  _categorySlug?: string
}

export interface MessageT {
  id: string
  listingId: string
  fromEmail: string
  fromName: string | null
  body: string
  createdAt: string
}

export const CATEGORY_GROUPS: { slug: string; name: string; icon: string }[] = [
  { slug: 'for-sale', name: 'For Sale', icon: 'Tag' },
  { slug: 'housing', name: 'Housing', icon: 'Home' },
  { slug: 'jobs', name: 'Jobs', icon: 'Briefcase' },
  { slug: 'services', name: 'Services', icon: 'Wrench' },
  { slug: 'community', name: 'Community', icon: 'Users' },
  { slug: 'gigs', name: 'Gigs', icon: 'Hand' },
  { slug: 'discussion', name: 'Discussion', icon: 'MessageSquare' },
]

export function formatPrice(price: number | null, label?: string | null): string {
  if (price === null || price === undefined) return label ? `$ ${label}` : '—'
  const dollars = price / 100
  const formatted = dollars >= 1000
    ? `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${dollars.toFixed(0)}`
  return label ? `${formatted} ${label}` : formatted
}

export function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - d)
  const min = 60_000
  const hr = 60 * min
  const day = 24 * hr
  if (diff < min) return 'just now'
  if (diff < hr) return `${Math.floor(diff / min)}m`
  if (diff < day) return `${Math.floor(diff / hr)}h`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fullDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
