import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ids: [] })
  const { data } = await supabase.from('liked_songs').select('song_id').eq('user_id', user.id)
  return NextResponse.json({ ids: (data ?? []).map((r: any) => r.song_id) })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.id !== 'string' || body.id.length > 24) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('liked_songs')
    .select('id')
    .eq('user_id', user.id)
    .eq('song_id', body.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('liked_songs').delete().eq('id', existing.id).eq('user_id', user.id)
    return NextResponse.json({ liked: false })
  }
  const { error } = await supabase.from('liked_songs').insert({
    user_id: user.id,
    song_id: body.id,
    title: String(body.title ?? '').slice(0, 300),
    artist: String(body.artist ?? '').slice(0, 200),
    thumbnail_url: String(body.thumb ?? '').slice(0, 500),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ liked: true })
}
