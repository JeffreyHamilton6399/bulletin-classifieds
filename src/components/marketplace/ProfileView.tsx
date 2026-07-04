'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from '@/lib/next-auth-client'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, MapPin, Clock, Eye, Pencil, Check, Loader2, ImageOff, Mail,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { formatPrice, relativeTime } from '@/lib/types'

const AVATAR_COLORS: Record<string, string> = {
  oxblood: 'bg-oxblood',
  forest: 'bg-emerald-700',
  ochre: 'bg-amber-600',
  slate: 'bg-slate-600',
  plum: 'bg-fuchsia-800',
  teal: 'bg-teal-700',
}

export function ProfileView({ userId }: { userId: string }) {
  const { go } = useNav()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const isOwn = session?.user?.id === userId

  const { data, isLoading } = useQuery({
    queryKey: isOwn ? ['me'] : ['profile', userId],
    queryFn: () => (isOwn ? api.me() : api.profile(userId)),
  })

  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // sync local state when data loads (for editing)
  const user = data?.user
  if (user && !editing && name === '' && user.name) {
    // one-shot init
    setTimeout(() => {
      setName(user.name)
      setBio(user.bio || '')
    }, 0)
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.updateMe({ bio, name })
      qc.invalidateQueries({ queryKey: ['me'] })
      setEditing(false)
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-16 w-16 bg-muted rounded-full" />
          <div className="h-6 w-48 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <p className="font-serif text-3xl mb-2">Profile not found.</p>
        <button onClick={() => go({ name: 'home' })} className="text-oxblood hover:underline">
          ← back home
        </button>
      </div>
    )
  }

  const listings = data?.listings || []
  const initials = (user.name || 'U').split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('')

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      <button
        onClick={() => go({ name: 'home' })}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-oxblood transition-colors mb-5"
      >
        <ArrowLeft className="size-3.5" />
        back home
      </button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start gap-4 pb-6 border-b hairline"
      >
        <span
          className={`size-16 sm:size-20 rounded-full grid place-items-center text-xl sm:text-2xl font-medium text-white shrink-0 ${
            AVATAR_COLORS[user.avatarColor] || 'bg-oxblood'
          }`}
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-2 bg-background border hairline rounded-sm text-xl font-serif focus:outline-none focus:border-foreground/40"
            />
          ) : (
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight truncate">{user.name}</h1>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="size-3" />
              {isOwn ? user.email : 'member since ' + new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
          {!editing && user.bio && (
            <p className="mt-3 text-sm text-foreground/80 max-w-prose whitespace-pre-wrap">{user.bio}</p>
          )}
          {editing && (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="A short bio — what you sell, where, what you're into…"
              className="mt-3 w-full px-2 py-1.5 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40 resize-none"
            />
          )}
          {editing && (
            <div className="text-right font-mono text-[10px] text-muted-foreground">{bio.length}/500</div>
          )}
        </div>
        {isOwn && (
          <div className="shrink-0">
            {editing ? (
              <button
                onClick={save}
                disabled={saving}
                className="h-8 px-3 bg-foreground text-background text-sm rounded-sm hover:bg-oxblood transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Save
              </button>
            ) : (
              <button
                onClick={() => { setBio(user.bio || ''); setName(user.name || ''); setEditing(true) }}
                className="h-8 px-3 border hairline rounded-sm text-sm flex items-center gap-1.5 hover:bg-accent transition-colors"
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Listings */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-2xl tracking-tight">
            {isOwn ? 'Your listings' : 'Listings'}
          </h2>
          <span className="font-mono text-xs text-muted-foreground">{listings.length}</span>
        </div>

        {listings.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {isOwn ? 'You haven’t posted anything yet.' : 'No active listings.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map((l: any, i: number) => (
              <motion.button
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25 }}
                onClick={() => go({ name: 'listing', id: l.id })}
                className="group text-left"
              >
                <div className="aspect-square bg-muted overflow-hidden rounded-sm border hairline mb-1.5">
                  {l._thumb ? (
                    <img
                      src={l._thumb}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground/30">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-oxblood transition-colors">
                  {l.title}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{formatPrice(l.price, l.priceLabel)}</span>
                  <span>{relativeTime(l.createdAt)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
