'use client'

export interface StoredListing {
  id: string
  token: string
  title: string
  postedAt: string
}

const KEY = 'bulletin:tokens'

/** Read all stored management tokens from this browser. */
export function getStoredTokens(): StoredListing[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredListing[]) : []
  } catch {
    return []
  }
}

/** Save a listing's management token after posting. */
export function storeListingToken(entry: StoredListing) {
  if (typeof window === 'undefined') return
  const existing = getStoredTokens().filter((l) => l.id !== entry.id)
  existing.unshift(entry)
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 200)))
}

/** Add a token by pasting a management link. Returns true if added. */
export function addToken(entry: StoredListing): boolean {
  if (typeof window === 'undefined') return false
  const existing = getStoredTokens()
  if (existing.some((l) => l.id === entry.id)) return false
  existing.unshift(entry)
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 200)))
  return true
}

/** Remove a stored token (keeps the listing itself). */
export function removeStoredToken(id: string) {
  if (typeof window === 'undefined') return
  const existing = getStoredTokens().filter((l) => l.id !== id)
  localStorage.setItem(KEY, JSON.stringify(existing))
}

/** Just the token strings, for the API request. */
export function getTokenStrings(): string[] {
  return getStoredTokens().map((l) => l.token)
}

/**
 * Parse a management link/URL or bare token into its parts.
 * Accepts: full URL, ?token=..., /manage/XXXX, or a bare token.
 */
export function parseManageInput(input: string): { token: string; id?: string } | null {
  const s = input.trim()
  if (!s) return null
  // bare token (base64url, ~24 chars)
  if (/^[A-Za-z0-9_-]{16,48}$/.test(s)) return { token: s }
  // URL with token query param
  try {
    const u = new URL(s)
    const t = u.searchParams.get('token')
    if (t) return { token: t }
  } catch {
    /* not a URL */
  }
  // path segment after /manage/
  const m = s.match(/manage\/([A-Za-z0-9_-]{16,48})/)
  if (m) return { token: m[1] }
  return null
}
