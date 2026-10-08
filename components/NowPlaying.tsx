'use client'
import { useEffect, useState } from 'react'
import type { Song } from '@/lib/types'
import { usePlayer } from './PlayerContext'
import { Icon } from './Icons'
import AddToPlaylist from './AddToPlaylist'

type Tab = 'next' | 'lyrics' | 'related'
const TABS: { id: Tab; label: string }[] = [
  { id: 'next', label: 'Up next' },
  { id: 'lyrics', label: 'Lyrics' },
  { id: 'related', label: 'Related' },
]

function SongRow({ song, active, onClick }: { song: Song; active: boolean; onClick: () => void }) {
  return (
    <button className={'qrow' + (active ? ' on' : '')} onClick={onClick}>
      {song.thumb ? <img src={song.thumb} alt="" referrerPolicy="no-referrer" /> : <span className="ph" />}
      <span className="m">
        <span className="t">{song.title}</span>
        <span className="a">{song.artist}</span>
      </span>
    </button>
  )
}

export default function NowPlaying() {
  const p = usePlayer()
  const s = p.current
  const sid = s?.id
  const [tab, setTab] = useState<Tab>('next')
  const [lyrics, setLyrics] = useState<string | null | undefined>(undefined)
  const [related, setRelated] = useState<Song[] | null>(null)
  const [needLogin, setNeedLogin] = useState(false)

  useEffect(() => {
    setLyrics(undefined)
    setRelated(null)
    setNeedLogin(false)
  }, [sid])

  useEffect(() => {
    if (!p.expanded) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') p.setExpanded(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [p.expanded, p.setExpanded])

  useEffect(() => {
    if (!p.expanded || !s || !s.src || tab !== 'lyrics' || lyrics !== undefined) return
    let alive = true
    fetch(`/api/lyrics?id=${encodeURIComponent(s.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setLyrics(d.lyrics || null)
      })
      .catch(() => {
        if (alive) setLyrics(null)
      })
    return () => {
      alive = false
    }
  }, [p.expanded, s, tab, lyrics])

  useEffect(() => {
    if (!p.expanded || !s || tab !== 'related' || related !== null) return
    let alive = true
    const q = new URLSearchParams({ id: s.id, artist: s.artist, title: s.title })
    fetch(`/api/related?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : { songs: [] }))
      .then((d) => {
        if (!alive) return
        setNeedLogin(!!d.needLogin)
        setRelated(d.songs ?? [])
      })
      .catch(() => {
        if (alive) setRelated([])
      })
    return () => {
      alive = false
    }
  }, [p.expanded, s, tab, related])

  if (!p.expanded || !s) return null
  const isYt = !s.src
  const liked = p.liked.has(s.id)

  return (
    <div className="np" role="dialog" aria-label="Now playing">
      <div className="np-bg" style={s.thumb ? { backgroundImage: `url(${s.thumb})` } : undefined} />
      <div className="np-top">
        <button onClick={() => p.setExpanded(false)} aria-label="Close">
          <Icon name="down" outline />
        </button>
        <span>Now playing</span>
      </div>
      <div className="np-inner">
        <div className="np-left">
          {isYt ? (
            <div className="np-spacer" />
          ) : (
            <div className="np-cover">{s.thumb && <img src={s.thumb} alt="" referrerPolicy="no-referrer" />}</div>
          )}
          <h2 className="np-title">{s.title}</h2>
          <div className="np-artist">{s.artist}</div>
          <div className="np-actions">
            <button className={liked ? 'liked' : ''} onClick={() => p.toggleLike(s)}>
              <Icon name="heart" outline={!liked} />
              {liked ? 'Liked' : 'Like'}
            </button>
            <AddToPlaylist song={s} />
            {s.license && (
              <a className="np-lic" href={s.license} target="_blank" rel="noreferrer">
                CC license
              </a>
            )}
          </div>
        </div>
        <div className="np-right">
          <div className="np-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="np-body">
            {tab === 'next' && (
              <>
                <label className="auto">
                  <input type="checkbox" checked={p.autoplay} onChange={(e) => p.setAutoplay(e.target.checked)} />
                  Autoplay similar songs when the queue ends
                </label>
                {p.queue.length ? (
                  p.queue.map((q) => (
                    <SongRow key={q.id} song={q} active={q.id === s.id} onClick={() => p.play(q, p.queue)} />
                  ))
                ) : (
                  <div className="np-msg">The queue is empty.</div>
                )}
              </>
            )}

            {tab === 'lyrics' &&
              (isYt ? (
                <div className="np-msg">
                  Lyrics are not available for YouTube tracks here.{' '}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(s.title + ' ' + s.artist + ' lyrics')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search for the lyrics
                  </a>
                </div>
              ) : lyrics === undefined ? (
                <div className="np-msg">Loading...</div>
              ) : lyrics === null ? (
                <div className="np-msg">No lyrics available for this track.</div>
              ) : (
                <pre className="lyrics">{lyrics}</pre>
              ))}

            {tab === 'related' &&
              (related === null ? (
                <div className="np-msg">Loading...</div>
              ) : needLogin ? (
                <div className="np-msg">Sign in to see related songs for YouTube tracks.</div>
              ) : related.length ? (
                related.map((r) => <SongRow key={r.id} song={r} active={false} onClick={() => p.play(r, related)} />)
              ) : (
                <div className="np-msg">No related songs found.</div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
