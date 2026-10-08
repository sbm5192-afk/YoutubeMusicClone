'use client'
import type { Song } from '@/lib/types'
import SongCard from './SongCard'

export default function SongGrid({ songs }: { songs: Song[] }) {
  return (
    <div className="grid">
      {songs.map((s) => (
        <SongCard key={s.id} song={s} queue={songs} />
      ))}
    </div>
  )
}
