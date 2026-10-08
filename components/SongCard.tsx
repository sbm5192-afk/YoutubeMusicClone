'use client'
import type { Song } from '@/lib/types'
import { usePlayer } from './PlayerContext'
import { Icon } from './Icons'

export default function SongCard({ song, queue }: { song: Song; queue: Song[] }) {
  const { play, current, playing } = usePlayer()
  const active = current?.id === song.id
  return (
    <button className={'card' + (active ? ' active' : '')} onClick={() => play(song, queue)}>
      <div className="art">
        {song.thumb && <img src={song.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" />}
        {song.src && <span className="tag">FREE</span>}
        <span className="overlay">
          <i>
            <Icon name={active && playing ? 'pause' : 'play'} />
          </i>
        </span>
      </div>
      <div className="t">{song.title}</div>
      <div className="a">{song.artist}</div>
    </button>
  )
}
