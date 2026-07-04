'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession, signOut } from '@/lib/next-auth-client'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Pencil, Check, Loader2, ImageOff, Mail,
  RefreshCw, Trash2, Clock, Eye,
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

function expiresIn(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const day = 86400000
  if (diff <= 0) return 'expired'
  const days = Math.floor(diff / day)
  if (days < 1) return `${Math.floor(diff / 3600000)}h left`
  return `${days}d left`
}

export function ProfileView({ userId }: { userId: string }) {
  const { go } = useNav()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const isOwn = session?.user?.id === userId

  const { data, isLoading, error } = useQuery({
    queryKey: isOwn ? ['me'] : ['profile', userId],
    queryFn: () => (isOwn ? api.me() : api.profile(userId)),
    retry: false,
  })

  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  // Auto sign-out on ghost session (401 from /api/me)
  if (isOwn && error && (error as any).message?.includes('401')) {
    toast.error('Your session expired — signing you out')
    signOut({ redirect: false })
    go({ name: 'home' })
  }

  const user = data?.user
  // one-shot init of edit fields
  if (user && !editing && name === '' && user.name) {
    setTimeout(() => { setName(user.name); setBio(user.bio || '') }, 0)
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

  const renew = async (id: string, token: string) => {
    setBusy(id + '-renew')
    try {
      await api.renewListing(id, token)
      toast.success('Listing renewed for 30 more days')
      qc.invalidateQueries({ queryKey: ['me'] })
    } catch (e: any) {
      toast.error(e.message || 'Could not renew')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (id: string, token: string) => {
    if (!confirm('Remove this listing?')) return
    setBusy(id + '-del')
    try {
      await api.deleteListing(id, token)
      toast.success('Listing removed')
      qc.invalidateQueries({ queryKey: ['me'] })
    } catch (e: any) {
      toast.error(e.message || 'Could not remove')
    } finally {
      setBusy(null)
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
        <p className="text-muted-foreground mb-6">
          {isOwn
            ? 'Your session may have expired. Try signing in again.'
            : 'This user may no longer exist.'}
        </p>
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
            {isOwn ? (
              <>
                <p className="mb-3">You haven’t posted anything yet.</p>
                <button onClick={() => go({ name: 'post' })} className="text-oxblood hover:underline">
                  Post your first listing →
                </button>
              </>
            ) : 'No active listings.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map((l: any, i: number) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.25 }}
                className="group"
              >
                <button
                  onClick={() => go({ name: 'listing', id: l.id })}
                  className="block w-full text-left"
                >
                  <div className="aspect-square bg-muted overflow-hidden rounded-sm border hairline mb-1.5 relative">
                    {l._thumb ? (
                      <img src={l._thumb} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground/30">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                    {l.status === 'REMOVED' && (
                      <div className="absolute inset-0 bg-background/70 grid place-items-center">
                        <span className="text-xs font-mono text-muted-foreground">removed</span>
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
                </button>
                {/* Manage controls for own listings */}
                {isOwn && l.status !== 'REMOVED' && l.editToken && (
                  <div className="mt-1 flex gap-1.5">
                    <button
                      onClick={() => renew(l.id, l.editToken)}
                      disabled={busy === l.id + '-renew'}
                      title="Renew"
                      className="flex-1 h-7 border hairline rounded-sm text-[11px] flex items-center justify-center gap-1 hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      {busy === l.id + '-renew' ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                    </button>
                    <button
                      onClick={() => remove(l.id, l.editToken)}
                      disabled={busy === l.id + '-del'}
                      title="Remove"
                      className="flex-1 h-7 border hairline border-oxblood/30 text-oxblood rounded-sm text-[11px] flex items-center justify-center gap-1 hover:bg-oxblood-soft transition-colors disabled:opacity-50"
                    >
                      {busy === l.id + '-del' ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
