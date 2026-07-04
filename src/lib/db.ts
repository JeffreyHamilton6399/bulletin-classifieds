import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Resolve the database path. On Vercel (serverless) the filesystem is read-only
// except for /tmp, so we fall back there. Locally we use the file path from .env.
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  // Vercel: write to /tmp so the SQLite file is writable during invocation
  if (process.env.VERCEL) return `file:/tmp/bulletin.db`
  return `file:${path.join(process.cwd(), 'db', 'custom.db')}`
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
    datasources: {
      db: { url: resolveDatabaseUrl() },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
