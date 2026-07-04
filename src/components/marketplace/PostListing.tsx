'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowLeft, X, Upload, ImagePlus, Loader2, Check, Info, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useNav } from '@/store/nav'
import { storeListingToken } from '@/lib/tokens'
import { cn } from '@/lib/utils'

const PRICE_LABELS = [
  { value: '', label: '—' },
  { value: 'obo', label: 'or best offer' },
  { value: 'firm', label: 'firm' },
  { value: 'free', label: 'free' },
  { value: 'trade', label: 'trade' },
]

export function PostListing() {
  const { regionId, go } = useNav()
  const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: api.regions })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories })
  const region = regions?.find((r) => r.id === regionId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [priceLabel, setPriceLabel] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [locationName, setLocationName] = useState(region?.name || '')
  const [contactEmail, setContactEmail] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [showPhone, setShowPhone] = useState(false)

  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return
    if (images.length >= 12) {
      toast.error('Maximum 12 images')
      return
    }
    setUploading(true)
    try {
      const remaining = 12 - images.length
      const slice = Array.from(files).slice(0, remaining)
      const urls = await api.upload(slice)
      setImages((prev) => [...prev, ...urls])
      toast.success(`Uploaded ${urls.length} image${urls.length > 1 ? 's' : ''}`)
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [images.length])

  const submit = async () => {
    setError('')
    if (!title.trim() || title.trim().length < 4) return setError('Title must be at least 4 characters.')
    if (!description.trim() || description.trim().length < 10) return setError('Description must be at least 10 characters.')
    if (!categoryId) return setError('Choose a category.')
    if (!contactEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) return setError('A valid contact email is required.')
    setSubmitting(true)
    try {
      const created = await api.createListing({
        title, description,
        price: price === '' ? null : Number(price),
        priceLabel: priceLabel || null,
        regionId,
        categoryId,
        locationName: locationName || region?.name,
        contactEmail, contactName, contactPhone, showPhone,
        images,
      })
      // Save the management token to this browser so "Your listings" can find it.
      storeListingToken({
        id: created.id,
        token: created.editToken,
        title: created.title,
        postedAt: created.createdAt,
      })
      toast.success('Listing published — saved to Your listings on this device')
      go({ name: 'listing', id: created.id })
    } catch (e: any) {
      setError(e.message || 'Failed to post.')
      toast.error(e.message || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-5">
      <button
        onClick={() => go({ name: 'home' })}
        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-oxblood transition-colors mb-4"
      >
        <ArrowLeft className="size-3.5" />
        cancel
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-serif text-4xl tracking-tight">Post a listing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          in <span className="text-foreground">{region?.name}, {region?.state}</span> · listings auto-expire after 30 days
        </p>
      </motion.div>

      {/* How it works — no account needed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mt-5 grid sm:grid-cols-3 gap-px bg-border border hairline rounded-sm overflow-hidden"
      >
        <div className="bg-background p-3.5">
          <div className="flex items-center gap-1.5 text-oxblood">
            <ShieldCheck className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wider">No account</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Post with just an email. No signup, no password — ever.
          </p>
        </div>
        <div className="bg-background p-3.5">
          <div className="flex items-center gap-1.5 text-oxblood">
            <Info className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Anonymous relay</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Buyers email you through a relay. Your address stays private.
          </p>
        </div>
        <div className="bg-background p-3.5">
          <div className="flex items-center gap-1.5 text-oxblood">
            <Check className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Token-protected</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            A secret key is saved to this device so only you can renew or remove.
          </p>
        </div>
      </motion.div>

      <div className="mt-6 space-y-5">
        {/* Title */}
        <Field label="Title" hint="be specific — make it searchable">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Vintage Moog synthesizer, barely used"
            maxLength={120}
            className="w-full h-11 px-3 bg-background border hairline rounded-sm text-[15px] focus:outline-none focus:border-foreground/40"
          />
        </Field>

        {/* Category */}
        <Field label="Category" hint="choose the closest match">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-11 px-3 bg-background border hairline rounded-sm text-[15px] focus:outline-none focus:border-foreground/40"
          >
            <option value="">Select a category…</option>
            {categories?.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {c.children?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {c.name} / {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        {/* Price */}
        <Field label="Price" hint="leave blank for jobs/services/giveaways">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full h-11 pl-7 pr-3 bg-background border hairline rounded-sm text-[15px] font-mono tnum focus:outline-none focus:border-foreground/40"
              />
            </div>
            <select
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
              className="h-11 px-2 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
            >
              {PRICE_LABELS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </Field>

        {/* Description */}
        <Field label="Description" hint="condition, details, pickup/shipping, anything relevant">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={4000}
            placeholder="Describe what you're offering. The more detail, the better the responses."
            className="w-full px-3 py-2.5 bg-background border hairline rounded-sm text-[15px] leading-relaxed focus:outline-none focus:border-foreground/40 resize-y"
          />
          <div className="text-right font-mono text-[10px] text-muted-foreground mt-1">
            {description.length} / 4000
          </div>
        </Field>

        {/* Location */}
        <Field label="Location" hint="neighborhood or area within your region">
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder={region?.name || 'e.g. Mission District'}
            className="w-full h-11 px-3 bg-background border hairline rounded-sm text-[15px] focus:outline-none focus:border-foreground/40"
          />
        </Field>

        {/* Images */}
        <Field label="Images" hint="up to 12 — first image is the thumbnail">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {images.length > 0 ? (
            <Reorder.Group axis="x" values={images} onReorder={setImages} className="flex gap-2 flex-wrap">
              {images.map((url, i) => (
                <Reorder.Item
                  key={url}
                  value={url}
                  className="relative w-20 h-20 shrink-0 rounded-sm overflow-hidden border hairline cursor-grab active:cursor-grabbing"
                >
                  <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  {i === 0 && (
                    <span className="absolute top-0.5 left-0.5 bg-oxblood text-white text-[8px] font-mono uppercase px-1 rounded-sm">
                      cover
                    </span>
                  )}
                  <button
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute top-0.5 right-0.5 size-5 grid place-items-center bg-background/80 hover:bg-oxblood hover:text-white rounded-full transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Reorder.Item>
              ))}
              {images.length < 12 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 shrink-0 border border-dashed hairline rounded-sm grid place-items-center text-muted-foreground hover:text-oxblood hover:border-oxblood/50 transition-colors"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                </button>
              )}
            </Reorder.Group>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-28 border border-dashed hairline rounded-sm grid place-items-center gap-1.5 text-muted-foreground hover:text-oxblood hover:border-oxblood/50 transition-colors"
            >
              {uploading ? (
                <><Loader2 className="size-5 animate-spin" /> <span className="text-sm">Uploading…</span></>
              ) : (
                <><Upload className="size-5" /> <span className="text-sm">Click to upload images</span></>
              )}
            </button>
          )}
        </Field>

        {/* Contact */}
        <div className="pt-2 border-t hairline">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            How buyers reach you
          </h2>
          <div className="space-y-3">
            <Field label="Contact email" required>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-11 px-3 bg-background border hairline rounded-sm text-[15px] focus:outline-none focus:border-foreground/40"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Your name (optional)">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Morgan"
                  className="w-full h-11 px-3 bg-background border hairline rounded-sm text-[15px] focus:outline-none focus:border-foreground/40"
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="555-555-5555"
                  className="w-full h-11 px-3 bg-background border hairline rounded-sm text-[15px] font-mono tnum focus:outline-none focus:border-foreground/40"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="size-4 accent-oxblood"
              />
              Show my phone number on the listing
            </label>
            <p className="text-xs text-muted-foreground">
              Your email is never shown publicly — buyers message you through an anonymous relay.
            </p>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 border hairline border-oxblood/40 bg-oxblood-soft text-sm text-oxblood rounded-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={submit}
            disabled={submitting}
            className="h-11 px-6 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-oxblood transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {submitting ? 'Posting…' : 'Publish listing'}
          </button>
          <button
            onClick={() => go({ name: 'home' })}
            className="h-11 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, hint, required, children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium">
          {label} {required && <span className="text-oxblood">*</span>}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
