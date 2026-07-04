'use client'

// Workaround for a Turbopack/NextAuth v4 interop issue where the named
// SessionProvider export resolves to undefined at runtime. Importing the
// CommonJS module's default and re-exporting makes it reliably available.
import NextAuthReact from 'next-auth/react'

export const SessionProvider: React.ComponentType<{
  children: React.ReactNode
  session?: any
}> =
  (NextAuthReact as any).SessionProvider ||
  (NextAuthReact as any).default?.SessionProvider ||
  (NextAuthReact as any)

export const useSession: typeof import('next-auth/react').useSession =
  (NextAuthReact as any).useSession

export const signIn: typeof import('next-auth/react').signIn =
  (NextAuthReact as any).signIn

export const signOut: typeof import('next-auth/react').signOut =
  (NextAuthReact as any).signOut
