'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, Map as MapIcon, SlidersHorizontal } from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { ListingRow } from './ListingRow'
import { MapView } from './MapView'
import { Breadcrumbs } from './Breadcrumbs'
import { cn } from '@/lib/utils'

const SORTS = [
  { value: 'recent', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
]

export function BrowseView({ initialCategory, initialQ }: { initialCategory?: string; initialQ?: string }) {
  const { regionId, go } = useNav()
  const [category, setCategory] = useState(initialCategory || '')
  const [q, setQ] = useState(initialQ || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [hasImage, setHasImage] = useState(false)
  const [sort, setSort] = useState('recent')
  const [view, setView] = useState<'list' | 'map'>('list')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: api.regions })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const region = regions?.find((r) => r.id === regionId) || null

  const params: Record<string, string | undefined> = {
    regionId: regionId || undefined,
    category: category || undefined,
    q: q || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    hasImage: hasImage ? '1' : undefined,
    sort,
    limit: '100',
  }

  const { data: listings, isFetching } = useQuery({
    queryKey: ['listings', params],
    queryFn: () => api.listings(params),
    placeholderData: (prev) => prev,
  })

  const activeCat = categories?.find((c) => c.slug === category)

  const FilterBar = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="h-8 px-2 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
      >
        <option value="">All categories</option>
        {categories?.map((c) => (
          <optgroup key={c.id} label={c.name}>
            <option value={c.slug}>{c.name} — all</option>
            {c.children?.map((s) => (
              <option key={s.id} value={s.slug}>
                {c.name} / {s.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="flex items-center gap-1 h-8">
        <span className="font-mono text-xs text-muted-foreground">$</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="min"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-16 h-8 px-2 bg-background border hairline rounded-sm text-sm font-mono tnum focus:outline-none focus:border-foreground/40"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="max"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-16 h-8 px-2 bg-background border hairline rounded-sm text-sm font-mono tnum focus:outline-none focus:border-foreground/40"
        />
      </div>

      <button
        onClick={() => setHasImage((v) => !v)}
        className={cn(
          'h-8 px-3 border hairline rounded-sm text-sm transition-colors',
          hasImage ? 'bg-foreground text-background border-foreground' : 'hover:bg-accent',
        )}
      >
        has image
      </button>

      <button
        onClick={() => {
          setCategory('')
          setQ('')
          setMinPrice('')
          setMaxPrice('')
          setHasImage(false)
          setSort('recent')
        }}
        className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-oxblood transition-colors"
      >
        reset
      </button>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-8 px-2 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="flex border hairline rounded-sm overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={cn(
              'h-8 w-8 grid place-items-center transition-colors',
              view === 'list' ? 'bg-foreground text-background' : 'hover:bg-accent',
            )}
            aria-label="List view"
          >
            <List className="size-4" />
          </button>
          <button
            onClick={() => setView('map')}
            className={cn(
              'h-8 w-8 grid place-items-center border-l hairline transition-colors',
              view === 'map' ? 'bg-foreground text-background' : 'hover:bg-accent',
            )}
            aria-label="Map view"
          >
            <MapIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5">
      <Breadcrumbs
        items={[
          { label: region?.name || 'Home', view: { name: 'home' } },
          { label: activeCat ? activeCat.name : q ? `Search: "${q}"` : 'All listings' },
        ]}
      />
      <div className="flex items-baseline gap-3 mb-4 flex-wrap">
        <h1 className="font-serif text-3xl tracking-tight">
          {activeCat ? activeCat.name : q ? `“${q}”` : 'All listings'}
        </h1>
        <span className="font-mono text-xs text-muted-foreground">
          {listings?.length ?? 0} {listings?.length === 1 ? 'result' : 'results'}
          {isFetching && ' · …'}
        </span>
      </div>

      {/* Mobile filter toggle */}
      <div className="flex items-center gap-2 mb-3 sm:hidden">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex items-center gap-1.5 h-8 px-3 border hairline rounded-sm text-sm"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </button>
        <div className="ml-auto flex border hairline rounded-sm overflow-hidden">
          <button onClick={() => setView('list')} className={cn('h-8 w-8 grid place-items-center', view === 'list' && 'bg-foreground text-background')}>
            <List className="size-4" />
          </button>
          <button onClick={() => setView('map')} className={cn('h-8 w-8 grid place-items-center border-l hairline', view === 'map' && 'bg-foreground text-background')}>
            <MapIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Filter bar (desktop always, mobile collapsible) */}
      <div className="hidden sm:block mb-3 pb-3 border-b hairline">{FilterBar}</div>
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden overflow-hidden mb-3"
          >
            <div className="pb-3 border-b hairline space-y-2">{FilterBar}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {view === 'list' ? (
        <div className="border-t hairline">
          <AnimatePresence mode="popLayout">
            {listings?.map((l, i) => (
              <ListingRow
                key={l.id}
                listing={l}
                index={i}
                onOpen={() => go({ name: 'listing', id: l.id })}
              />
            ))}
          </AnimatePresence>
          {!isFetching && !listings?.length && (
            <div className="py-20 text-center">
              <div className="font-serif text-2xl text-muted-foreground mb-1">Nothing here.</div>
              <div className="text-sm text-muted-foreground">
                Try widening your filters or{' '}
                <button onClick={() => go({ name: 'post' })} className="text-oxblood hover:underline">
                  post the first listing
                </button>
                .
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border hairline rounded-sm overflow-hidden h-[60vh] sm:h-[70vh]">
          <MapView
            listings={listings || []}
            region={region}
            onOpen={(id) => go({ name: 'listing', id })}
          />
        </div>
      )}
    </div>
  )
}
