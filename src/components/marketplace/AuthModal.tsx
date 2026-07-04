'use client'

import { useState } from 'react'
import { signIn } from '@/lib/next-auth-client'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { X, Loader2, Mail, Lock, User, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const qc = useQueryClient()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          toast.error('Please enter your name')
          setLoading(false)
          return
        }
        await api.signup({ name: name.trim(), email, password })
        // auto-login after signup
        const res = await signIn('credentials', { email, password, redirect: false })
        if (res?.error) throw new Error('Account created, but login failed')
        toast.success(`Welcome, ${name.trim().split(' ')[0]}!`)
      } else {
        const res = await signIn('credentials', { email, password, redirect: false })
        if (res?.error) throw new Error('Wrong email or password')
        toast.success('Signed in')
      }
      qc.invalidateQueries({ queryKey: ['me'] })
      onClose()
      setName(''); setEmail(''); setPassword('')
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-foreground/30 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-full flex items-center justify-center p-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-sm bg-popover border hairline rounded-md shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b hairline">
              <div>
                <h2 className="font-serif text-2xl tracking-tight">
                  {mode === 'signup' ? 'Create account' : 'Welcome back'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {mode === 'signup'
                    ? 'Save your listings to a profile.'
                    : 'Sign in to manage your listings.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="size-7 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* tabs */}
            <div className="flex border-b hairline">
              {(['signup', 'login'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    mode === m
                      ? 'border-oxblood text-oxblood'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m === 'signup' ? 'Sign up' : 'Log in'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="p-5 space-y-3">
              {mode === 'signup' && (
                <Field label="Name" icon={<User className="size-3.5" />}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full h-10 pl-9 pr-3 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
                  />
                </Field>
              )}
              <Field label="Email" icon={<Mail className="size-3.5" />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                  className="w-full h-10 pl-9 pr-3 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
                />
              </Field>
              <Field label="Password" icon={<Lock className="size-3.5" />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="w-full h-10 pl-9 pr-3 bg-background border hairline rounded-sm text-sm focus:outline-none focus:border-foreground/40"
                />
              </Field>

              {mode === 'signup' && (
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-oxblood" />
                  Passwords are hashed with scrypt and never stored in plain text.
                  Still want to post anonymously? Just close this — no account needed.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-foreground text-background text-sm font-medium rounded-sm hover:bg-oxblood transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading
                  ? '…'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label, icon, children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  )
}
