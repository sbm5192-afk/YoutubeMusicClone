import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Serves YouTube cover images from our own domain (edge-cached for 24h) so they show even where i.ytimg.com is blocked.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return new NextResponse('bad id', { status: 400 })
  try {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, { next: { revalidate: 86400 } })
    if (!res.ok) return new NextResponse('not found', { status: 404 })
    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new NextResponse('error', { status: 502 })
  }
}
