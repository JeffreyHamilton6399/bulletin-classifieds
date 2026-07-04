'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from '@/lib/next-auth-client'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { UserRound, LogOut, ChevronDown, Settings } from 'lucide-react'
import { useNav } from '@/store/nav'
import { AuthModal } from './AuthModal'

const AVATAR_COLORS: Record<string, string> = {
  oxblood: 'bg-oxblood',
  forest: 'bg-emerald-700',
  ochre: 'bg-amber-600',
  slate: 'bg-slate-600',
  plum: 'bg-fuchsia-800',
  teal: 'bg-teal-700',
}

export function AuthButton() {
  const { data: session, status } = useSession()
  const { go } = useNav()
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (status === 'loading') {
    return <div className="size-8 rounded-full bg-muted animate-pulse" />
  }

  if (!session?.user) {
    return (
      <>
        <button
          onClick={() => setAuthOpen(true)}
          className="shrink-0 h-8 px-3 border hairline rounded-sm text-sm font-medium hover:bg-accent transition-colors"
        >
          Sign in
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }

  const name = session.user.name || session.user.email?.split('@')[0] || 'You'
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

  return (
    <>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 h-8 pr-1.5 pl-1 rounded-full hover:bg-accent transition-colors"
        >
          <span
            className={`size-6 rounded-full grid place-items-center text-[11px] font-medium text-white ${
              AVATAR_COLORS[(session.user as any).avatarColor] || 'bg-oxblood'
            }`}
          >
            {initials || 'U'}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-full mt-1 z-50 w-52 bg-popover border hairline rounded-md shadow-lg overflow-hidden py-1"
            >
              <div className="px-3 py-2 border-b hairline">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-xs text-muted-foreground truncate font-mono">
                  {session.user.email}
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  go({ name: 'profile', userId: session.user.id })
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <UserRound className="size-3.5" />
                Your profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  go({ name: 'settings' })
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left"
              >
                <Settings className="size-3.5" />
                Settings
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut().then(() => {
                    toast.success('Signed out')
                  })
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors text-left text-oxblood"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
