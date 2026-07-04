'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { categoryIcon } from '@/lib/icons'
import { useNav } from '@/store/nav'
import { formatPrice, relativeTime, type CategoryT } from '@/lib/types'
import { cn } from '@/lib/utils'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

export function HomeView() {
  const { regionId, go, setRegion } = useNav()
  const regionsQuery = useQuery({ queryKey: ['regions'], queryFn: api.regions })
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const { data: recent } = useQuery({
    queryKey: ['listings', 'recent', regionId],
    queryFn: () => api.listings({ regionId: regionId!, limit: '24' }),
    enabled: !!regionId,
  })
  const { data: stats } = useQuery({
    queryKey: ['stats', regionId],
    queryFn: () => api.stats(regionId!),
    enabled: !!regionId,
  })

  // Database setup error — show clear instructions
  const dbError = regionsQuery.error || categoriesQuery.error
  if (dbError) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <div className="border hairline border-oxblood/40 bg-oxblood-soft rounded-md p-6">
          <h2 className="font-serif text-2xl mb-2">Database not set up</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {String((dbError as Error).message)}
          </p>
          <div className="text-sm space-y-2">
            <p className="font-medium">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-oxblood hover:underline">Supabase dashboard</a></li>
              <li>Go to <strong>SQL Editor</strong> → New query</li>
              <li>Paste the contents of <code className="bg-muted px-1 rounded">supabase-setup.sql</code> from the repo</li>
              <li>Click <strong>Run</strong></li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  const regions = regionsQuery.data
  const categories = categoriesQuery.data

  // --- Region picker (no region) ---
  if (!regionId) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Local classifieds, since now
          </p>
          <h1 className="font-serif text-5xl sm:text-7xl leading-[0.95] tracking-tight text-balance">
            Where are<br />
            <span className="italic text-oxblood">you</span> looking?
          </h1>
          <p className="mt-6 text-muted-foreground max-w-md text-pretty">
            Pick a region to browse listings near you — furniture, apartments, jobs, and the
            rest of the neighborhood bulletin board.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border border hairline"
        >
          {regions?.map((r) => (
            <motion.button
              key={r.id}
              variants={item}
              onClick={() => setRegion(r.id)}
              className="group bg-background p-5 text-left hover:bg-accent/50 transition-colors"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {r.state}
              </div>
              <div className="mt-1 text-lg font-medium tracking-tight group-hover:text-oxblood transition-colors">
                {r.name}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    )
  }

  const region = regions?.find((r) => r.id === regionId)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // --- Home dashboard ---
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Masthead */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="border-b hairline pb-6 mb-6"
      >
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {today}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight mt-1">
              {region?.name}{' '}
              <span className="font-mono text-base text-muted-foreground align-middle">
                {region?.state}
              </span>
            </h1>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {recent?.length ?? 0} fresh listings
            </div>
            <button
              onClick={() => go({ name: 'post' })}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-oxblood hover:underline underline-offset-4"
            >
              Post a listing →
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>
            <span className="text-foreground font-medium tnum">{stats?.total ?? '—'}</span> active
          </span>
          <span className="opacity-30">/</span>
          <span>
            <span className="text-foreground font-medium tnum">{stats?.today ?? '—'}</span> posted today
          </span>
          <span className="opacity-30">/</span>
          <span>
            <span className="text-foreground font-medium tnum">{stats?.categories ?? '—'}</span> categories
          </span>
          <span className="opacity-30 hidden sm:inline">/</span>
          <span className="hidden sm:inline">
            <span className="text-foreground font-medium tnum">{stats?.withImages ?? '—'}</span> with photos
          </span>
        </div>
      </motion.div>

      {/* Category directory — newspaper columns */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-6 mb-10"
      >
        {categories?.map((cat) => {
          const Icon = categoryIcon(cat.icon)
          return (
            <motion.div key={cat.id} variants={item}>
              <button
                onClick={() => go({ name: 'browse', category: cat.slug })}
                className="group flex items-center gap-2 mb-2"
              >
                <Icon className="size-4 text-oxblood" />
                <h3 className="font-medium tracking-tight group-hover:text-oxblood transition-colors">
                  {cat.name}
                </h3>
              </button>
              <ul className="space-y-0.5">
                {cat.children?.slice(0, 7).map((sub) => (
                  <li key={sub.id}>
                    <button
                      onClick={() => go({ name: 'browse', category: cat.slug })}
                      className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all duration-150"
                    >
                      {sub.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </motion.section>

      {/* Recently posted */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-2xl tracking-tight">Recently posted</h2>
          <button
            onClick={() => go({ name: 'browse' })}
            className="text-sm font-mono text-muted-foreground hover:text-oxblood transition-colors"
          >
            view all →
          </button>
        </div>
        <div className="border-t hairline">
          {recent?.map((l, i) => (
            <motion.button
              key={l.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.25 }}
              onClick={() => go({ name: 'listing', id: l.id })}
              className="group flex w-full items-center gap-4 py-3 border-b hairline text-left hover:bg-accent/40 transition-colors px-1 -mx-1"
            >
              <div className="w-12 h-12 shrink-0 bg-muted overflow-hidden rounded-sm">
                {l._thumb ? (
                  <img
                    src={l._thumb}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground/40 text-[10px] font-mono">
                    n/a
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate group-hover:text-oxblood transition-colors">
                  {l.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{l._categoryName}</span>
                  <span className="opacity-40">·</span>
                  <span className="truncate">{l.locationName}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono tnum font-medium">
                  {formatPrice(l.price, l.priceLabel)}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  {relativeTime(l.createdAt)}
                </div>
              </div>
            </motion.button>
          ))}
          {!recent?.length && (
            <div className="py-12 text-center text-muted-foreground">
              No listings yet. Be the first to post.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
