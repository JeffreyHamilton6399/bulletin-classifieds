'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, PenLine, Moon, Sun, MapPin, UserRound } from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export function Header() {
  const { regionId, setRegion, go } = useNav()
  const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: api.regions })
  const [regionOpen, setRegionOpen] = useState(false)
  const [q, setQ] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const current = regions?.find((r) => r.id === regionId)

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b hairline">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3 sm:gap-5">
          {/* Wordmark */}
          <button
            onClick={() => go({ name: 'home' })}
            className="group flex items-baseline gap-1.5 shrink-0"
          >
            <span className="font-serif text-2xl leading-none tracking-tight text-foreground">
              Bulletin
            </span>
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground -translate-y-0.5">
              est. local
            </span>
          </button>

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* Region selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setRegionOpen((o) => !o)}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-oxblood transition-colors"
            >
              <MapPin className="size-3.5 text-oxblood" />
              <span className="hidden xs:inline max-w-[120px] truncate">
                {current ? current.name : 'Select region'}
              </span>
              <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', regionOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {regionOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRegionOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-full mt-1 z-50 w-64 bg-popover border hairline rounded-md shadow-lg overflow-hidden"
                  >
                    <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b hairline">
                      Choose your region
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1">
                      {regions?.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setRegion(r.id)
                            setRegionOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-accent transition-colors',
                            r.id === regionId && 'text-oxblood font-medium',
                          )}
                        >
                          <span>{r.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{r.state}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <form
            className="flex-1 max-w-md ml-auto"
            onSubmit={(e) => {
              e.preventDefault()
              go({ name: 'browse', q: q.trim() || undefined })
            }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={regionId ? 'Search listings…' : 'Search (select a region first)'}
                className="w-full h-8 pl-8 pr-3 text-sm bg-transparent border-b hairline focus:border-foreground/40 outline-none transition-colors placeholder:text-muted-foreground/70"
              />
            </div>
          </form>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="shrink-0 size-8 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Your listings */}
          <button
            onClick={() => go({ name: 'account' })}
            className="shrink-0 size-8 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Your listings"
            title="Your listings"
          >
            <UserRound className="size-4" />
          </button>

          {/* Post button */}
          <button
            onClick={() => go({ name: 'post' })}
            disabled={!regionId}
            className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-oxblood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PenLine className="size-3.5" />
            <span className="hidden sm:inline">Post</span>
          </button>
        </div>
      </div>
    </header>
  )
}
