import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseUA } from '@/lib/ua'

export const dynamic = 'force-dynamic'

const clip = (v: unknown, n: number): string | null => (typeof v === 'string' && v ? v.slice(0, n) : null)

// Writes one analytics event (page view or song play) into public.analytics_events
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const type = body?.type
  const sid = clip(body?.sid, 64)
  if ((type !== 'view' && type !== 'play') || !sid || sid.length < 8) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const ua = request.headers.get('user-agent') ?? ''
  const info = parseUA(ua)
  if (info.bot) return NextResponse.json({ ok: true, skipped: true })

  const h = request.headers
  let city = h.get('x-vercel-ip-city')
  try {
    if (city) city = decodeURIComponent(city)
  } catch {}

  const row: Record<string, unknown> = {
    type,
    session_id: sid,
    path: clip(body?.path, 300),
    country: clip(h.get('x-vercel-ip-country'), 8),
    city: clip(city, 100),
    device: info.device,
    browser: info.browser,
    os: info.os,
    referrer: clip(body?.referrer, 200),
  }

  if (type === 'play') {
    const source = body?.song_source === 'free' ? 'free' : body?.song_source === 'youtube' ? 'youtube' : null
    const songId = clip(body?.song_id, 24)
    if (!songId || !source) return NextResponse.json({ ok: false }, { status: 400 })
    row.song_id = songId
    row.song_title = clip(body?.song_title, 300)
    row.song_artist = clip(body?.song_artist, 200)
    row.song_source = source
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  row.user_id = user?.id ?? null

  const { error } = await supabase.from('analytics_events').insert(row)
  if (error) {
    console.error('analytics insert failed', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
