// Ensures a DATABASE_URL is available for Prisma at build time, even when no
// .env file is present (e.g. on Vercel before env vars are configured).
// This only affects build-time prisma generate — the runtime DB path is
// resolved in src/lib/db.ts.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')

const ENV_PATH = '.env'

function hasDatabaseUrl() {
  if (process.env.DATABASE_URL) return true
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf8')
    return /^DATABASE_URL\s*=/m.test(content)
  } catch {
    return false
  }
}

if (!hasDatabaseUrl()) {
  const fallback = 'DATABASE_URL=file:/tmp/bulletin-build.db\n'
  fs.appendFileSync(ENV_PATH, fallback)
  console.log('[ensure-env] added fallback DATABASE_URL to .env for build')
} else {
  console.log('[ensure-env] DATABASE_URL already present')
}
