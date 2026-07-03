'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Mail, RefreshCw, Trash2, Eye, Clock, ImageOff, Loader2, Inbox,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { formatPrice, relativeTime } from '@/lib/types'
import { cn } from '@/lib/utils'

function expiresIn(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const day = 86400000
  if (diff <= 0) return 'expired'
  const days = Math.floor(diff / day)
  if (days < 1) return `expires in ${Math.floor(diff / 3600000)}h`
  return `expires in ${days}d`
}

export function MyListings({ initialEmail }: { initialEmail?: string }) {
  const { go } = useNav()
  const qc = useQueryClient()
  const [email, setEmail] = useState(initialEmail || '')
  const [submitted, setSubmitted] = useState(!!initialEmail)
  const [busy, setBusy] = useState<string | null>(null)

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['my-listings', email],
    queryFn: () => api.myListings(email),
    enabled: submitted && !!email,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Enter a valid email address')
      return
    }
    setSubmitted(true)
  }

  const renew = async (id: string) => {
    setBusy(id + '-renew')
    try {
      await api.renewListing(id, email)
      toast.success('Listing renewed for 30 more days')
      qc.invalidateQueries({ queryKey: ['my-listings', email] })
    } catch (e: any) {
      toast.error(e.message || 'Could not renew')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this listing? This cannot be undone.')) return
    setBusy(id + '-del')
    try {
      await api.deleteListing(id, email)
      toast.success('Listing removed')
      qc.invalidateQueries({ queryKey: ['my-listings', email] })
    } catch (e: any) {
      toast.error(e.message || 'Could not remove')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
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
        <h1 className="font-serif text-4xl tracking-tight">Your listings</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
          No account needed. Enter the email you posted with to manage, renew, or
          remove your listings.
        </p>
      </motion.div>

      {!submitted ? (
        <form onSubmit={submit} className="mt-6">
          <label className="block text-sm font-medium mb-1.5">Your email</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-11 pl-10 pr-3 bg-background border hairline rounded-sm text-[15px] focus:outline-none focus:border-foreground/40"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-oxblood transition-colors"
            >
              Find listings
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
            <span className="font-mono uppercase tracking-wider shrink-0">Note</span>
            We look up listings by the contact email you used when posting. No password —
            your email is the key.
          </p>
        </form>
      ) : (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b hairline">
            <div className="text-sm">
              <span className="text-muted-foreground">Showing listings for</span>{' '}
              <span className="font-mono">{email}</span>
            </div>
            <button
              onClick={() => {
                setSubmitted(false)
                setEmail('')
              }}
              className="text-xs font-mono text-muted-foreground hover:text-oxblood transition-colors"
            >
              use different email
            </button>
          </div>

          {isLoading && (
            <div className="py-12 grid place-items-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-sm text-oxblood">
              Could not load listings. {String(error)}
            </div>
          )}

          {!isLoading && listings?.length === 0 && (
            <div className="py-16 text-center">
              <Inbox className="size-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-serif text-2xl mb-1">Nothing posted yet</p>
              <p className="text-sm text-muted-foreground mb-5">
                No listings found for this email.
              </p>
              <button
                onClick={() => go({ name: 'post' })}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-oxblood hover:underline underline-offset-4"
              >
                Post your first listing →
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {listings?.map((l, i) => {
              const expired = new Date(l.expiresAt).getTime() < Date.now()
              const removed = l.status === 'REMOVED'
              return (
                <motion.div
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-stretch gap-3 py-3 border-b hairline"
                >
                  <button
                    onClick={() => go({ name: 'listing', id: l.id })}
                    className="w-16 h-16 shrink-0 bg-muted overflow-hidden rounded-sm border hairline"
                  >
                    {l._thumb ? (
                      <img src={l._thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground/30">
                        <ImageOff className="size-4" />
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => go({ name: 'listing', id: l.id })}
                      className="text-sm font-medium leading-snug hover:text-oxblood transition-colors text-left line-clamp-1"
                    >
                      {l.title}
                    </button>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-mono text-muted-foreground">
                      <span>{formatPrice(l.price, l.priceLabel)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" /> {l.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {removed ? 'removed' : expired ? 'expired' : expiresIn(l.expiresAt)}
                      </span>
                      <span className="uppercase tracking-wide">{l._categoryName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
                    {!removed && (
                      <button
                        onClick={() => renew(l.id)}
                        disabled={busy === l.id + '-renew'}
                        title="Renew for 30 days"
                        className="h-8 px-2.5 border hairline rounded-sm text-xs flex items-center gap-1.5 hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        {busy === l.id + '-renew' ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <RefreshCw className="size-3" />
                        )}
                        <span className="hidden sm:inline">Renew</span>
                      </button>
                    )}
                    {!removed && (
                      <button
                        onClick={() => remove(l.id)}
                        disabled={busy === l.id + '-del'}
                        title="Remove listing"
                        className="h-8 px-2.5 border hairline border-oxblood/30 text-oxblood rounded-sm text-xs flex items-center gap-1.5 hover:bg-oxblood-soft transition-colors disabled:opacity-50"
                      >
                        {busy === l.id + '-del' ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
