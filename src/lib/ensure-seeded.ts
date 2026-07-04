import { existsSync, copyFileSync, mkdirSync } from 'fs'
import path from 'path'

let booted = false

/**
 * Resolve the runtime database file path. Mirrors the logic in db.ts so the
 * boot step copies the seed DB to the exact location Prisma will open.
 */
export function resolveDbPath(): string {
  if (process.env.DATABASE_URL) {
    // strip the leading "file:" prefix
    return process.env.DATABASE_URL.replace(/^file:/, '')
  }
  if (process.env.VERCEL) return '/tmp/bulletin.db'
  return path.join(process.cwd(), 'db', 'custom.db')
}

/**
 * On serverless platforms (Vercel), the filesystem is read-only except /tmp,
 * and the bundled SQLite DB at db/custom.db can't be written to. We copy the
 * shipped, pre-seeded DB into the runtime location on the first cold start so
 * the demo has data. Subsequent invocations reuse it for the life of the warm
 * instance. No-op locally.
 */
export async function ensureBooted() {
  if (!process.env.VERCEL || booted) return
  booted = true
  try {
    const target = resolveDbPath()
    if (!existsSync(target)) {
      // the bundled db lives next to the project root at build time
      const candidates = [
        path.join(process.cwd(), 'db', 'custom.db'),
        path.join(process.cwd(), '..', 'db', 'custom.db'),
      ]
      const src = candidates.find((p) => existsSync(p))
      if (src) {
        const dir = path.dirname(target)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        copyFileSync(src, target)
        console.log('[ensureBooted] copied seed DB to', target)
      } else {
        console.log('[ensureBooted] no seed DB found; starting empty')
      }
    }
  } catch (e) {
    console.error('ensureBooted failed:', e)
  }
}

// keep `ensureSeeded` name as an alias for backwards refs
export const ensureSeeded = ensureBooted
