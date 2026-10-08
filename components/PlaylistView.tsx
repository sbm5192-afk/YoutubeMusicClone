'use client'
import { useRouter } from 'next/navigation'
import type { Song } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { usePlayer } from './PlayerContext'
import { Icon } from './Icons'

export default function PlaylistView({ id, name, songs }: { id: string; name: string; songs: Song[] }) {
  const p = usePlayer()
  const router = useRouter()

  async function remove(songId: string) {
    await createClient().from('playlist_songs').delete().eq('playlist_id', id).eq('song_id', songId)
    router.refresh()
  }

  async function del() {
    if (!confirm('Delete this playlist? The songs themselves are not affected.')) return
    await createClient().from('playlists').delete().eq('id', id)
    router.push('/library?tab=playlists')
    router.refresh()
  }

  return (
    <div>
      <div className="pl-head">
        <div className="pl-hcover">{name.slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="pl-kind">Playlist</div>
          <h1>{name}</h1>
          <div className="pl-meta">{songs.length} songs</div>
          <div className="pl-actions">
            <button className="btn" disabled={!songs.length} onClick={() => songs.length && p.play(songs[0], songs)}>
              Play
            </button>
            <button className="btn-ghost btn-danger" onClick={del}>
              Delete playlist
            </button>
          </div>
        </div>
      </div>
      <div className="plist">
        {songs.length === 0 && (
          <p className="empty" style={{ margin: 0 }}>
            This playlist is empty. Open any song and press Save to add it here.
          </p>
        )}
        {songs.map((s, i) => (
          <div key={s.id} className={'qrow-wrap' + (p.current?.id === s.id ? ' on' : '')}>
            <button className="qrow" onClick={() => p.play(s, songs)}>
              <span className="rank">{i + 1}</span>
              {s.thumb ? <img src={s.thumb} alt="" referrerPolicy="no-referrer" /> : <span className="ph" />}
              <span className="m">
                <span className="t">{s.title}</span>
                <span className="a">{s.artist}</span>
              </span>
            </button>
            <button className="x" onClick={() => remove(s.id)} aria-label="Remove from playlist">
              <Icon name="close" outline />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
