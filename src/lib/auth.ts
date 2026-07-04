import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { ensureBooted } from './ensure-seeded'
import crypto from 'crypto'

// --- Password hashing with Node's built-in scrypt (no dependencies) ---
const SCRYPT_KEYLEN = 32
const SCRYPT_SALTLEN = 16

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SCRYPT_SALTLEN)
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1], 'hex')
  const expected = Buffer.from(parts[2], 'hex')
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN)
  // constant-time comparison
  return crypto.timingSafeEqual(hash, expected)
}

// Resolve a NextAuth secret. Prefer the env var; fall back to a stable
// derived value so the demo works on Vercel even before env vars are set.
// (In production you should always set NEXTAUTH_SECRET.)
function resolveSecret(): string {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET
  // stable fallback — NOT secure for production, but lets the demo function
  return crypto.createHash('sha256').update('bulletin-demo-secret-fallback').digest('hex')
}

export const authOptions: NextAuthOptions = {
  secret: resolveSecret(),
  // JWT strategy works on serverless (no session DB needed)
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 }, // 30 days
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await ensureBooted()
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.trim().toLowerCase()
        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null
        if (!verifyPassword(credentials.password, user.passwordHash)) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        ;(session.user as any).id = token.id as string
      }
      return session
    },
  },
  pages: {
    // we use a modal instead of dedicated pages, but keep signIn as fallback
    signIn: '/',
  },
}
