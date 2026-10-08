import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hydrate } from '@/lib/songs'
import { thumbOf } from '@/lib/types'
import SongGrid from '@/components/SongGrid'
import NewPlaylist from '@/components/NewPlaylist'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Library · Ekko Music' }

const TABS = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'songs', label: 'Songs' },
  { id: 'history', label: 'History' },
]

export default async function Library({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/library')

  const tab = TABS.some((t) => t.id === searchParams.tab) ? (searchParams.tab as string) : 'playlists'

  let body: React.ReactNode = null

  if (tab === 'playlists') {
    const { data } = await supabase
      .from('playlists')
      .select('id,name,created_at,playlist_songs(count)')
      .order('created_at', { ascending: false })
    const lists = (data ?? []) as any[]
    body = (
      <>
        <NewPlaylist />
        {lists.length === 0 ? (
          <p className="empty">You have no playlists yet. Create your first one above.</p>
        ) : (
          <div className="pl-grid">
            {lists.map((p) => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="pl-card">
                <div className="pl-cover">{String(p.name).slice(0, 1).toUpperCase()}</div>
                <div className="t">{p.name}</div>
                <div className="a">{p.playlist_songs?.[0]?.count ?? 0} songs</div>
              </Link>
            ))}
          </div>
        )}
      </>
    )
  } else if (tab === 'songs') {
    const { data } = await supabase
      .from('liked_songs')
      .select('song_id,title,artist,thumbnail_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const songs = await hydrate(
      ((data ?? []) as any[]).map((r) => ({
        id: r.song_id as string,
        title: r.title as string,
        artist: (r.artist ?? '') as string,
        thumb: (String(r.song_id).startsWith('jm:') ? r.thumbnail_url || '' : thumbOf(r.song_id)) as string,
      }))
    )
    body = songs.length ? <SongGrid songs={songs} /> : <p className="empty">You have not liked any songs yet.</p>
  } else {
    const { data } = await supabase
      .from('play_history')
      .select('video_id,title,artist,thumbnail_url')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(150)
    const seen = new Set<string>()
    const rows: { id: string; title: string; artist: string; thumb: string }[] = []
    for (const r of (data ?? []) as any[]) {
      if (seen.has(r.video_id) || rows.length >= 48) continue
      seen.add(r.video_id)
      rows.push({
        id: r.video_id,
        title: r.title,
        artist: r.artist ?? '',
        thumb: String(r.video_id).startsWith('jm:') ? r.thumbnail_url || '' : thumbOf(r.video_id),
      })
    }
    const songs = await hydrate(rows)
    body = songs.length ? <SongGrid songs={songs} /> : <p className="empty">Songs you play will show up here.</p>
  }

  return (
    <div>
      <h1 className="title">Library</h1>
      <div className="pills">
        {TABS.map((t) => (
          <Link key={t.id} href={`/library?tab=${t.id}`} className={'chip' + (tab === t.id ? ' on' : '')}>
            {t.label}
          </Link>
        ))}
      </div>
      {body}
    </div>
  )
}
