'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice, relativeTime, type ListingT } from '@/lib/types'
import { cn } from '@/lib/utils'

type Row = ListingT & {
  _thumb?: string | null
  _imageCount?: number
  _categoryName?: string
  _regionName?: string | null
}

/**
 * A stylized, dependency-free map. Plots listings as dots positioned by
 * lat/lng relative to the region's bounding box. Deliberately abstract —
 * grid lines, crosshair center, region label — to feel like an editorial
 * schematic rather than a generic Google Maps embed.
 */
export function MapView({
  listings,
  region,
  onOpen,
  activeId,
}: {
  listings: Row[]
  region: { lat: number; lng: number; radiusKm: number; name: string } | null
  onOpen: (id: string) => void
  activeId?: string
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  const { bounds, points } = useMemo(() => {
    if (!region) return { bounds: null, points: [] as { l: Row; x: number; y: number }[] }
    // ~degrees per km
    const latPerKm = 1 / 111
    const lngPerKm = 1 / (111 * Math.cos((region.lat * Math.PI) / 180))
    const span = region.radiusKm * 1.4
    const minLat = region.lat - span * latPerKm
    const maxLat = region.lat + span * latPerKm
    const minLng = region.lng - span * lngPerKm
    const maxLng = region.lng + span * lngPerKm
    const pts = listings
      .filter((l) => l.lat != null && l.lng != null)
      .map((l) => ({
        l,
        x: ((l.lng! - minLng) / (maxLng - minLng)) * 100,
        y: (1 - (l.lat! - minLat) / (maxLat - minLat)) * 100,
      }))
    return { bounds: { minLat, maxLat, minLng, maxLng }, points: pts }
  }, [region, listings])

  if (!region) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-sm">
        Select a region to see the map.
      </div>
    )
  }

  const active = points.find((p) => p.l.id === (hovered || activeId))

  return (
    <div className="relative h-full w-full bg-accent/20 overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Crosshair center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full border border-oxblood/30" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-oxblood/10" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-oxblood/10" />

      {/* Region label */}
      <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-background/70 px-2 py-0.5 rounded-sm">
        {region.name} · {points.length} mapped
      </div>

      {/* Dots */}
      {points.map((p) => (
        <button
          key={p.l.id}
          onMouseEnter={() => setHovered(p.l.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onOpen(p.l.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span
            className={cn(
              'block rounded-full transition-all',
              hovered === p.l.id || activeId === p.l.id
                ? 'size-4 bg-oxblood ring-2 ring-background'
                : 'size-2.5 bg-oxblood/70 hover:bg-oxblood hover:size-3.5',
            )}
          />
        </button>
      ))}

      {/* Tooltip */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute z-20 w-56 bg-popover border hairline rounded-md shadow-lg overflow-hidden pointer-events-none"
            style={{
              left: `min(${active.x}%, calc(100% - 14.5rem))`,
              top: `min(${active.y}%, calc(100% - 9rem))`,
              transform: 'translate(8px, 8px)',
            }}
          >
            {active.l._thumb && (
              <div className="h-24 bg-muted overflow-hidden">
                <img src={active.l._thumb} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-2.5">
              <div className="text-sm font-medium leading-snug line-clamp-2">
                {active.l.title}
              </div>
              <div className="mt-1 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>{formatPrice(active.l.price, active.l.priceLabel)}</span>
                <span>{relativeTime(active.l.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
