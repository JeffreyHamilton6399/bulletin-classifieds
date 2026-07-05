import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export const POST = withDbErrorHandler(async (req: NextRequest) => {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const name = String(body.name || '').trim()

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (password.length > 200) {
    return NextResponse.json({ error: 'Password is too long' }, { status: 400 })
  }
  if (!name || name.length < 1) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const recent = await db.user.count({
    where: { createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
  })
  if (recent >= 5) {
    return NextResponse.json({ error: 'Too many signups. Try again shortly.' }, { status: 429 })
  }

  const colors = ['oxblood', 'forest', 'ochre', 'slate', 'plum', 'teal']
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json(user, { status: 201 })
})
