'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { Icon } from './Icons'

// "Save" button with a small playlist picker (used on the Now playing screen)
export default function AddToPlaylist({ song }: { song: Song }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  async function toggleOpen() {
    if (open) {
      setOpen(false)
      return
    }
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/')
      return
    }
    const { data } = await supabase.from('playlists').select('id,name').order('created_at', { ascending: false })
    setLists((data ?? []) as { id: string; name: string }[])
    setMsg('')
    setOpen(true)
  }

  async function add(playlistId: string) {
    const { error } = await createClient()
      .from('playlist_songs')
      .insert({
        playlist_id: playlistId,
        song_id: song.id,
        title: song.title.slice(0, 300),
        artist: song.artist.slice(0, 200),
        thumbnail_url: song.src ? (song.thumb || '').slice(0, 500) : '',
      })
    if (error) setMsg(error.code === '23505' ? 'Already in this playlist' : 'Could not add the song')
    else {
      setMsg('Added to the playlist')
      router.refresh()
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('playlists')
      .insert({ name: n.slice(0, 80), user_id: user.id })
      .select('id,name')
      .single()
    if (error || !data) {
      setMsg('Could not create the playlist')
      return
    }
    setLists((l) => [data as { id: string; name: string }, ...l])
    setName('')
    await add((data as { id: string }).id)
  }

  return (
    <>
      <button type="button" onClick={toggleOpen}>
        <Icon name="plus" outline />
        Save
      </button>
      {open && (
        <div className="pl-pop">
          <div className="pl-pop-title">Save to playlist</div>
          {lists.length === 0 && <div className="pl-pop-empty">You have no playlists yet.</div>}
          {lists.map((l) => (
            <button key={l.id} type="button" className="pl-pop-item" onClick={() => add(l.id)}>
              {l.name}
            </button>
          ))}
          <form onSubmit={create} className="pl-pop-new">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New playlist name" maxLength={80} />
            <button type="submit">Create</button>
          </form>
          {msg && <div className="pl-pop-msg">{msg}</div>}
        </div>
      )}
    </>
  )
}
