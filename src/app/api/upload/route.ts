import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

/**
 * Resolve a writable directory for uploads. On Vercel the filesystem is
 * read-only except /tmp, so we store uploads there and serve them via a
 * dedicated read route. Locally we use public/uploads so images are served
 * directly by Next's static handler.
 */
function uploadDir(): { dir: string; urlPrefix: string; vercel: boolean } {
  if (process.env.VERCEL) {
    return { dir: '/tmp/uploads', urlPrefix: '/api/uploads', vercel: true }
  }
  return { dir: path.join(process.cwd(), 'public', 'uploads'), urlPrefix: '/uploads', vercel: false }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('images').filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files' }, { status: 400 })
  }
  if (files.length > 12) {
    return NextResponse.json({ error: 'Max 12 images' }, { status: 400 })
  }

  const { dir, urlPrefix } = uploadDir()
  await mkdir(dir, { recursive: true })

  const urls: string[] = []
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `${file.name} exceeds 8MB` },
        { status: 413 },
      )
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: `${file.name} is not an image` }, { status: 400 })
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const name = `${crypto.randomUUID()}.${safeExt}`
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(dir, name), buf)
    urls.push(`${urlPrefix}/${name}`)
  }

  return NextResponse.json({ urls }, { status: 201 })
}

/**
 * On Vercel, uploaded files live in /tmp and aren't statically served.
 * This GET handler reads them back so <img src="/api/uploads/xxx"> works.
 * Locally this is unused (files are in public/uploads).
 */
export async function GET(req: NextRequest) {
  if (!process.env.VERCEL) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name || !/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|gif)$/.test(name)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }
  const filePath = path.join('/tmp/uploads', name)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const buf = await readFile(filePath)
  const ext = name.split('.').pop()
  const type =
    ext === 'png' ? 'image/png' :
    ext === 'webp' ? 'image/webp' :
    ext === 'gif' ? 'image/gif' : 'image/jpeg'
  return new NextResponse(buf, {
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' },
  })
}
