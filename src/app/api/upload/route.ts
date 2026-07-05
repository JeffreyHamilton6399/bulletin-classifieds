import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabase, SUPABASE_BUCKET } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const files = formData.getAll('images').filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files' }, { status: 400 })
  }
  if (files.length > 12) {
    return NextResponse.json({ error: 'Max 12 images' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Image storage not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 },
    )
  }

  const urls: string[] = []
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${file.name} exceeds 8MB` }, { status: 413 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: `${file.name} is not an image` }, { status: 400 })
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const name = `${crypto.randomUUID()}.${safeExt}`
    const buf = Buffer.from(await file.arrayBuffer())

    const { error: upErr } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(name, buf, { contentType: file.type, upsert: false })

    if (upErr) {
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 })
    }

    const { data: pub } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(name)
    urls.push(pub.publicUrl)
  }

  return NextResponse.json({ urls }, { status: 201 })
}
