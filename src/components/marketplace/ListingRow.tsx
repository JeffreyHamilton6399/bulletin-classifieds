'use client'

import { motion } from 'framer-motion'
import { formatPrice, relativeTime, type ListingT } from '@/lib/types'
import { cn } from '@/lib/utils'

type Row = ListingT & {
  _thumb?: string | null
  _imageCount?: number
  _categoryName?: string
  _categorySlug?: string
  _regionName?: string | null
}

export function ListingRow({
  listing,
  index,
  onOpen,
  active,
}: {
  listing: Row
  index: number
  onOpen: () => void
  active?: boolean
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{
        duration: 0.22,
        delay: Math.min(index * 0.025, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={onOpen}
      className={cn(
        'group flex w-full items-stretch gap-0 text-left border-b hairline transition-colors',
        active ? 'bg-accent/60' : 'hover:bg-accent/40',
      )}
    >
      {/* Thumbnail */}
      <div className="w-20 sm:w-24 shrink-0 bg-muted overflow-hidden border-r hairline">
        {listing._thumb ? (
          <img
            src={listing._thumb}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground/30 text-[9px] font-mono">
            no img
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 py-3 px-3 sm:px-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-[15px] font-medium leading-snug truncate group-hover:text-oxblood transition-colors">
            {listing.title}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="uppercase tracking-wide">{listing._categoryName}</span>
            <span className="opacity-30">/</span>
            <span className="truncate">{listing.locationName}</span>
            {!!listing._imageCount && listing._imageCount > 1 && (
              <>
                <span className="opacity-30">/</span>
                <span>{listing._imageCount} img</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-[15px] font-mono tnum font-medium text-foreground">
            {formatPrice(listing.price, listing.priceLabel)}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            {relativeTime(listing.createdAt)}
          </div>
        </div>
      </div>
    </motion.button>
  )
}
