'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sun, Moon, Check } from 'lucide-react'
import { useNav } from '@/store/nav'
import { cn } from '@/lib/utils'

export function SettingsView() {
  const { go } = useNav()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const options = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Paper-cream background, ink text.' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Dark ink background, cream text.' },
  ] as const

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6">
      <button
        onClick={() => go({ name: 'home' })}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-oxblood transition-colors mb-4"
      >
        <ArrowLeft className="size-3.5" />
        back home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-serif text-4xl tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Preferences for this browser.
        </p>
      </motion.div>

      {/* Appearance */}
      <section className="mt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          Appearance
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const Icon = opt.icon
            const active = mounted && theme === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'relative text-left p-4 border hairline rounded-sm transition-colors',
                  active ? 'border-oxblood bg-oxblood-soft' : 'hover:bg-accent/50',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-oxblood" />
                  <span className="font-medium">{opt.label}</span>
                  {active && <Check className="size-3.5 text-oxblood ml-auto" />}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            )
          })}
        </div>
        {!mounted && (
          <p className="mt-2 text-xs text-muted-foreground font-mono">loading…</p>
        )}
      </section>

      {/* About */}
      <section className="mt-10 pt-6 border-t hairline">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
          About
        </h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-4 border-b hairline pb-2">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono text-xs">1.0.0</dd>
          </div>
          <div className="flex justify-between gap-4 border-b hairline pb-2">
            <dt className="text-muted-foreground">Built with</dt>
            <dd className="font-mono text-xs">Next.js · Prisma · Framer Motion</dd>
          </div>
          <div className="flex justify-between gap-4 border-b hairline pb-2">
            <dt className="text-muted-foreground">Data</dt>
            <dd className="font-mono text-xs text-right">
              {process.env.VERCEL ? 'Supabase Postgres (persistent)' : 'Local Postgres'}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
