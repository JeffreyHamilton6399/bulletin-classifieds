'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { categoryIcon } from '@/lib/icons'
import { useNav } from '@/store/nav'
import { cn } from '@/lib/utils'
import type { CategoryT } from '@/lib/types'

export function CategoryNav() {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const { go, view } = useNav()
  const [hovered, setHovered] = useState<string | null>(null)

  const activeCat = view.name === 'browse' ? view.category : undefined

  return (
    <nav className="border-b hairline bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-stretch gap-0 overflow-x-auto no-scrollbar">
          {categories?.map((cat) => {
            const Icon = categoryIcon(cat.icon)
            const active = activeCat === cat.slug
            return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered((h) => (h === cat.id ? null : h))}
              >
                <button
                  onClick={() => go({ name: 'browse', category: cat.slug })}
                  className={cn(
                    'flex items-center gap-1.5 h-10 px-3 sm:px-4 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
                    active
                      ? 'border-oxblood text-oxblood font-medium'
                      : 'border-transparent text-foreground/80 hover:text-foreground hover:border-border',
                  )}
                >
                  <Icon className="size-3.5 opacity-70" />
                  {cat.name}
                </button>

                <AnimatePresence>
                  {hovered === cat.id && cat.children && cat.children.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 top-full z-50 min-w-[200px] bg-popover border hairline rounded-md shadow-lg overflow-hidden py-1"
                    >
                      <button
                        onClick={() => go({ name: 'browse', category: cat.slug })}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        All {cat.name}
                        <span>→</span>
                      </button>
                      <div className="h-px bg-border my-0.5" />
                      {cat.children.map((sub) => (
                        <SubButton
                          key={sub.id}
                          sub={sub}
                          onClick={() => go({ name: 'browse', category: cat.slug, })}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function SubButton({ sub, onClick }: { sub: CategoryT; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-3 py-1.5 text-sm hover:bg-accent hover:text-oxblood transition-colors text-left"
    >
      {sub.name}
    </button>
  )
}
