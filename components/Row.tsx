'use client'
import { useRef } from 'react'
import type { Song } from '@/lib/types'
import SongCard from './SongCard'
import { Icon } from './Icons'

export default function Row({ title, songs, big = false }: { title: string; songs: Song[]; big?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (d: number) =>
    ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  if (!songs.length) return null
  return (
    <section className="row-sec">
      <div className="row-head">
        <h2>{title}</h2>
        <div className="arrows">
          <button onClick={() => scroll(-1)} aria-label="Scroll left">
            <Icon name="left" outline />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right">
            <Icon name="right" outline />
          </button>
        </div>
      </div>
      <div className={'row' + (big ? ' big' : '')} ref={ref}>
        {songs.map((s) => (
          <SongCard key={s.id} song={s} queue={songs} />
        ))}
      </div>
    </section>
  )
}
