import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.id !== 'string' || body.id.length > 24) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  await supabase.from('play_history').insert({
    user_id: user.id,
    video_id: body.id,
    title: String(body.title ?? '').slice(0, 300),
    artist: String(body.artist ?? '').slice(0, 200),
    thumbnail_url: String(body.thumb ?? '').slice(0, 500),
  })
  return NextResponse.json({ ok: true })
}
