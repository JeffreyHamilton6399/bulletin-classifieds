import { db } from './db'
import { existsSync, copyFileSync, mkdirSync } from 'fs'
import path from 'path'

let booted = false

/**
 * On serverless platforms (Vercel), the filesystem is read-only except /tmp,
 * and the bundled SQLite DB at db/custom.db can't be written to. We copy the
 * shipped, pre-seeded DB into /tmp on the first cold start so the demo has
 * data. Subsequent invocations reuse it for the life of the warm instance.
 * No-op locally.
 */
export async function ensureBooted() {
  if (!process.env.VERCEL || booted) return
  booted = true
  try {
    const tmpDir = '/tmp'
    const tmpDb = path.join(tmpDir, 'bulletin.db')
    if (!existsSync(tmpDb)) {
      // the bundled db lives next to the project root at build time
      const candidates = [
        path.join(process.cwd(), 'db', 'custom.db'),
        path.join(process.cwd(), '..', 'db', 'custom.db'),
      ]
      const src = candidates.find((p) => existsSync(p))
      if (src) {
        if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
        copyFileSync(src, tmpDb)
      }
    }
  } catch (e) {
    console.error('ensureBooted failed:', e)
  }
}

// keep `ensureSeeded` name as an alias for backwards refs
export const ensureSeeded = ensureBooted
