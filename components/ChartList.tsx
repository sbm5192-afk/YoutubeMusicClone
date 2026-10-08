'use client'
import type { Song } from '@/lib/types'
import { usePlayer } from './PlayerContext'

// Numbered chart list (Explore page)
export default function ChartList({ title, songs }: { title: string; songs: Song[] }) {
  const p = usePlayer()
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {songs.length === 0 && <div className="np-msg">Nothing to show right now.</div>}
      {songs.map((s, i) => (
        <button
          key={s.id}
          className={'qrow' + (p.current?.id === s.id ? ' on' : '')}
          onClick={() => p.play(s, songs)}
        >
          <span className="rank">{i + 1}</span>
          {s.thumb ? <img src={s.thumb} alt="" referrerPolicy="no-referrer" /> : <span className="ph" />}
          <span className="m">
            <span className="t">{s.title}</span>
            <span className="a">{s.artist}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
