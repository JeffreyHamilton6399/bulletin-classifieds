'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Flag, Eye, MapPin, Send, ShieldCheck, Copy, Check,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { ImageGallery } from './ImageGallery'
import { Breadcrumbs } from './Breadcrumbs'
import { formatPrice, fullDate, relativeTime, type ListingT } from '@/lib/types'
import { cn } from '@/lib/utils'

function expiresLabel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const day = 86400000
  if (diff <= 0) return 'expired'
  const days = Math.floor(diff / day)
  if (days < 1) return `in ${Math.floor(diff / 3600000)}h`
  return `in ${days}d`
}

const FLAG_REASONS = [
  { value: 'PROHIBITED', label: 'Prohibited item' },
  { value: 'MISCATEGORIZED', label: 'Miscategorized' },
  { value: 'SPAM', label: 'Spam / overpost' },
  { value: 'SCAM', label: 'Scam / fraud' },
  { value: 'DUPLICATE', label: 'Duplicate' },
  { value: 'OTHER', label: 'Other' },
]

export function ListingDetail({ id }: { id: string }) {
  const { go } = useNav()
  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.listing(id),
  })

  const [contactOpen, setContactOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-8 w-2/3 bg-muted rounded" />
          <div className="aspect-[4/3] bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
        <p className="font-serif text-3xl mb-2">This listing is gone.</p>
        <p className="text-muted-foreground mb-6">It may have expired, sold, or been removed.</p>
        <button onClick={() => go({ name: 'browse' })} className="text-oxblood hover:underline">
          ← back to listings
        </button>
      </div>
    )
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-5">
      <Breadcrumbs
        items={[
          { label: 'Listings', view: { name: 'browse' } },
          { label: listing.category?.name || 'Listing' },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8"
      >
        {/* Gallery */}
        <div>
          <ImageGallery images={listing.images} />
        </div>

        {/* Sidebar / details */}
        <div className="lg:border-l hairline lg:pl-8">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>{listing.category?.parentId ? `${listing.category.name} / ` : ''}{listing.category?.name}</span>
            <span className="opacity-40">·</span>
            <span>{relativeTime(listing.createdAt)}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl leading-[1.05] tracking-tight mt-2 text-balance">
            {listing.title}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-3xl tnum font-medium text-oxblood">
              {formatPrice(listing.price, listing.priceLabel)}
            </span>
          </div>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-3.5 text-oxblood/70" />
              {listing.locationName}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="size-3.5 text-oxblood/70" />
              {listing.viewCount} {listing.viewCount === 1 ? 'view' : 'views'}
            </div>
          </div>

          {/* Contact */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => setContactOpen((o) => !o)}
              className="w-full h-10 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-oxblood transition-colors flex items-center justify-center gap-2"
            >
              <Send className="size-4" />
              Reply by email
            </button>
            {listing.showPhone && listing.contactPhone && (
              <div className="px-3 py-2 border hairline rounded-sm text-sm flex items-center justify-between">
                <span className="font-mono tnum">{listing.contactPhone}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">call/text</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <ShieldCheck className="size-3.5 mt-0.5 shrink-0" />
              Your email is relayed to the poster anonymously. Never wire money or share financial info.
            </p>
          </div>

          {/* Meta actions */}
          <div className="mt-5 flex items-center gap-3 pt-4 border-t hairline">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              {copied ? 'copied' : 'copy link'}
            </button>
            <button
              onClick={() => setFlagOpen((o) => !o)}
              className="ml-auto flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-oxblood transition-colors"
            >
              <Flag className="size-3.5" />
              flag
            </button>
          </div>

          <AnimatePresence>
            {flagOpen && <FlagPanel id={id} onClose={() => setFlagOpen(false)} />}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mt-8 pt-8 border-t hairline grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8"
      >
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            Description
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
              {listing.description}
            </p>
          </div>
        </div>
        <div className="lg:border-l hairline lg:pl-8">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            Details
          </h2>
          <dl className="text-sm space-y-2">
            <Row label="Posted" value={fullDate(listing.createdAt)} />
            <Row label="Location" value={listing.locationName} />
            <Row label="Region" value={listing.region?.name || ''} />
            <Row label="Category" value={listing.category?.name || ''} />
            <Row label="Listing ID" value={listing.id.slice(-8).toUpperCase()} mono />
            <Row label="Expires" value={expiresLabel(listing.expiresAt)} />
          </dl>
        </div>
      </motion.div>

      {/* Contact form */}
      <AnimatePresence>
        {contactOpen && (
          <ContactPanel listing={listing} onClose={() => setContactOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b hairline pb-2">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={cn('text-right truncate', mono && 'font-mono tnum text-xs')}>{value}</dd>
    </div>
  )
}

function FlagPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!reason) return
    setLoading(true)
    try {
      await api.flag(id, reason)
      setDone(true)
      toast.success('Flag submitted — thank you')
    } catch {
      toast.error('Could not submit flag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      {done ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Thanks. A moderator will review this listing.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Why are you flagging?
          </p>
          <div className="grid grid-cols-1 gap-1">
            {FLAG_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={cn(
                  'text-left text-sm px-2 py-1.5 rounded-sm border hairline transition-colors',
                  reason === r.value ? 'bg-accent border-foreground/30' : 'hover:bg-accent/50',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!reason || loading}
            className="w-full h-8 mt-1 bg-oxblood text-white text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? '…' : 'Submit flag'}
          </button>
        </div>
      )}
    </motion.div>
  )
}

function ContactPanel({ listing, onClose }: { listing: ListingT; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!email) return setError('Your email is required.')
    if (body.trim().length < 5) return setError('Message is too short.')
    setLoading(true)
    try {
      await api.message(listing.id, { fromEmail: email, fromName: name, body })
      setSent(true)
      toast.success('Message sent to the poster')
    } catch (e: any) {
      setError(e.message || 'Something went wrong.')
      toast.error(e.message || 'Could not send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.22 }}
      className="mt-8 p-5 border hairline rounded-sm bg-accent/30"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-xl">Send a reply</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
      {sent ? (
        <div className="py-6 text-center">
          <Check className="size-8 mx-auto text-oxblood mb-2" />
          <p className="font-medium">Message sent.</p>
          <p className="text-sm text-muted-foreground mt-1">
            If the poster replies, it’ll come to {email}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Re: <span className="text-foreground">{listing.title}</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="h-9 px-3 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name (optional)"
              className="h-9 px-3 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hi, is this still available? …"
            rows={4}
            className="w-full px-3 py-2 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40 resize-none"
          />
          {error && <p className="text-xs text-oxblood">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="h-9 px-5 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-oxblood transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send message'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
