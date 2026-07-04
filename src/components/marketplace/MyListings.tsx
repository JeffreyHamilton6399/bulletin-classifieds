'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, RefreshCw, Trash2, Eye, Clock, ImageOff, Loader2, Inbox,
  KeyRound, Plus, Link2, Copy, ShieldCheck, ExternalLink,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { formatPrice } from '@/lib/types'
import {
  getStoredTokens, getTokenStrings, parseManageInput, addToken, removeStoredToken,
} from '@/lib/tokens'

function expiresIn(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const day = 86400000
  if (diff <= 0) return 'expired'
  const days = Math.floor(diff / day)
  if (days < 1) return `expires in ${Math.floor(diff / 3600000)}h`
  return `expires in ${days}d`
}

export function MyListings() {
  const { go } = useNav()
  const qc = useQueryClient()
  const [ready, setReady] = useState(false)
  const [tokens, setTokens] = useState<string[]>([])
  const [addInput, setAddInput] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  // hydrate tokens from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setTokens(getTokenStrings())
    setReady(true)
  }, [])

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['my-listings', tokens],
    queryFn: () => api.myListings(tokens),
    enabled: ready && tokens.length > 0,
  })

  const refreshTokens = () => {
    setTokens(getTokenStrings())
    qc.invalidateQueries({ queryKey: ['my-listings', tokens] })
  }

  const renew = async (id: string, token: string) => {
    setBusy(id + '-renew')
    try {
      await api.renewListing(id, token)
      toast.success('Listing renewed for 30 more days')
      qc.invalidateQueries({ queryKey: ['my-listings', tokens] })
    } catch (e: any) {
      toast.error(e.message || 'Could not renew')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string, token: string) => {
    if (!confirm('Remove this listing? This cannot be undone.')) return
    setBusy(id + '-del')
    try {
      await api.deleteListing(id, token)
      removeStoredToken(id)
      toast.success('Listing removed')
      setTokens(getTokenStrings())
      qc.invalidateQueries({ queryKey: ['my-listings', tokens] })
    } catch (e: any) {
      toast.error(e.message || 'Could not remove')
    } finally {
      setBusy(null)
    }
  }

  const forget = (id: string) => {
    removeStoredToken(id)
    setTokens(getTokenStrings())
    toast('Token removed from this device (listing still exists)')
  }

  const copyManageLink = (token: string) => {
    const url = `${window.location.origin}/?manage=${token}`
    navigator.clipboard.writeText(url)
    toast.success('Management link copied')
  }

  const handleAdd = () => {
    const parsed = parseManageInput(addInput)
    if (!parsed) {
      toast.error('Could not parse a management token from that input')
      return
    }
    const ok = addToken({
      id: parsed.id || `pending-${parsed.token}`,
      token: parsed.token,
      title: 'Added listing',
      postedAt: new Date().toISOString(),
    })
    if (ok) {
      toast.success('Management link added')
      setAddInput('')
      setAddOpen(false)
      setTokens(getTokenStrings())
    } else {
      toast('That listing is already in your list')
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
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-oxblood" />
          <h1 className="font-serif text-4xl tracking-tight">Your listings</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
          Listings you post are protected by a unique management token saved to
          this device — no account, no password. Only this browser can manage
          them, unless you share a listing&rsquo;s management link.
        </p>
      </motion.div>

      {/* Security note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mt-4 flex items-start gap-2.5 p-3 border hairline border-oxblood/30 bg-oxblood-soft rounded-sm"
      >
        <ShieldCheck className="size-4 text-oxblood shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          <span className="font-medium">Why no password?</span> Each listing gets
          its own secret key when you post. That key — not your email — authorizes
          renewals and deletions, so no one can touch your listings just by
          knowing your address. Keep management links private, like passwords.
        </p>
      </motion.div>

      {/* Add-by-link + refresh */}
      <div className="mt-5 flex items-center gap-2 pb-3 border-b hairline">
        {addOpen ? (
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                placeholder="Paste a management link…"
                className="w-full h-9 pl-9 pr-3 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <button
              onClick={handleAdd}
              className="h-9 px-3 bg-foreground text-background text-sm rounded-sm hover:bg-oxblood transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAddOpen(false); setAddInput('') }}
              className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 border hairline rounded-sm text-sm hover:bg-accent transition-colors"
            >
              <Plus className="size-3.5" />
              Add by link
            </button>
            <button
              onClick={refreshTokens}
              className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </>
        )}
      </div>

      {/* States */}
      {ready && tokens.length === 0 && !isLoading && (
        <div className="py-16 text-center">
          <Inbox className="size-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-serif text-2xl mb-1">No listings on this device yet</p>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Post a listing and it&rsquo;ll appear here automatically. Already
            posted elsewhere? Add it with the management link you saved.
          </p>
          <button
            onClick={() => go({ name: 'post' })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-oxblood hover:underline underline-offset-4"
          >
            Post a listing →
          </button>
        </div>
      )}

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
                    onClick={() => renew(l.id, l.editToken)}
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
                    onClick={() => remove(l.id, l.editToken)}
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
                <button
                  onClick={() => copyManageLink(l.editToken)}
                  title="Copy management link"
                  className="h-8 px-2.5 border hairline rounded-sm text-xs flex items-center gap-1.5 hover:bg-accent transition-colors"
                >
                  <Copy className="size-3" />
                  <span className="hidden sm:inline">Link</span>
                </button>
                <button
                  onClick={() => forget(l.id)}
                  title="Forget on this device"
                  className="h-8 px-2.5 border hairline rounded-sm text-xs flex items-center gap-1.5 hover:bg-accent transition-colors text-muted-foreground"
                >
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
