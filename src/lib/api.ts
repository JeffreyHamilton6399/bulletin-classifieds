import type { RegionT, CategoryT, ListingT } from './types'

async function jget<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

async function jpost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as any).error || `${res.status}`)
  return data as T
}

async function jpatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as any).error || `${res.status}`)
  return data as T
}

export const api = {
  regions: () => jget<RegionT[]>('/api/regions'),
  categories: () => jget<CategoryT[]>('/api/categories'),
  listings: (params: Record<string, string | undefined>) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
    return jget<(ListingT & { _thumb?: string | null; _imageCount?: number; _categoryName?: string; _categorySlug?: string; _regionName?: string | null })[]>(
      `/api/listings?${qs}`,
    )
  },
  listing: (id: string) => jget<ListingT>(`/api/listings/${id}`),
  createListing: (body: unknown) => jpost<ListingT>('/api/listings/create', body),
  renewListing: (id: string, email: string) => jpatch(`/api/listings/${id}`, { action: 'renew', email }),
  deleteListing: (id: string, email: string) => jpatch(`/api/listings/${id}`, { action: 'delete', email }),
  flag: (id: string, reason: string) => jpost(`/api/listings/${id}/flag`, { reason }),
  message: (id: string, body: { fromEmail: string; fromName?: string; body: string }) =>
    jpost(`/api/listings/${id}/message`, body),
  upload: async (files: File[]): Promise<string[]> => {
    const fd = new FormData()
    for (const f of files) fd.append('images', f)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error((data as any).error || 'upload failed')
    return (data as { urls: string[] }).urls
  },
  myListings: (email: string) =>
    jget<any[]>(`/api/my-listings?email=${encodeURIComponent(email)}`),
  stats: (regionId?: string) =>
    jget<{ total: number; withImages: number; categories: number; today: number }>(
      `/api/stats${regionId ? `?regionId=${regionId}` : ''}`,
    ),
}
