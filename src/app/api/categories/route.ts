import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureBooted } from '@/lib/ensure-seeded'
import { withDbErrorHandler } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export const GET = withDbErrorHandler(async () => {
  await ensureBooted()
  const cats = await db.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  // nest children under parents
  const byParent = new Map<string | null, typeof cats>()
  for (const c of cats) {
    const key = c.parentId ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  const roots = byParent.get(null) ?? []
  const nested = roots.map((r) => ({
    ...r,
    children: (byParent.get(r.id) ?? []).map((c) => ({
      ...c,
      children: byParent.get(c.id) ?? [],
    })),
  }))
  return NextResponse.json(nested)
})
