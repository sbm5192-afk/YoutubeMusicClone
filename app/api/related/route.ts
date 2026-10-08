import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchSongs } from '@/lib/youtube'
import { jamendoByArtist, jamendoHot } from '@/lib/jamendo'
import type { Song } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const id = (sp.get('id') ?? '').slice(0, 24)
  const artist = (sp.get('artist') ?? '').slice(0, 100).trim()
  const title = (sp.get('title') ?? '').slice(0, 150).trim()

  let songs: Song[] = []
  if (id.startsWith('jm:')) {
    songs = artist ? await jamendoByArtist(artist, 14) : []
    if (songs.length < 8) {
      const hot = await jamendoHot(14)
      songs = [...songs, ...hot]
    }
  } else {
    // YouTube searches cost API quota, so related songs for YouTube tracks need a signed-in user
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ songs: [], needLogin: true })
    songs = await searchSongs(artist || title, 16)
  }

  const seen = new Set<string>([id])
  const out: Song[] = []
  for (const s of songs) {
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
    if (out.length >= 14) break
  }
  return NextResponse.json({ songs: out })
}
