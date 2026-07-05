'use client'

import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNav, type View } from '@/store/nav'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  view?: View
}

/**
 * Breadcrumb navigation — shows where you are and lets you navigate back.
 * Solves the Craigslist problem of never knowing where you are in the hierarchy.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { go } = useNav()

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-mono text-muted-foreground mb-4 overflow-x-auto no-scrollbar">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3 opacity-30 shrink-0" />}
            {item.view && !isLast ? (
              <button
                onClick={() => go(item.view!)}
                className="hover:text-oxblood transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ) : (
              <span className={cn('whitespace-nowrap', isLast && 'text-foreground font-medium')}>
                {item.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
