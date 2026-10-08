'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/lib/types'
import { checkYt } from '@/lib/ytprobe'
import { sendTrack } from '@/lib/track'
import { PlayerContext } from './PlayerContext'
import PlayerBar from './PlayerBar'
import NowPlaying from './NowPlaying'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady?: () => void
  }
}

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [current, setCurrent] = useState<Song | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [queueList, setQueueList] = useState<Song[]>([])
  const [expanded, setExpanded] = useState(false)
  const [ytOk, setYtOk] = useState<boolean | null>(null)
  const [autoplay, setAutoplayState] = useState(true)
  const [toast, setToast] = useState<{ text: string; q?: string } | null>(null)

  const queue = useRef<Song[]>([])
  const player = useRef<any>(null)
  const ready = useRef(false)
  const host = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentRef = useRef<Song | null>(null)
  const toggleRef = useRef<() => void>(() => {})
  const failRef = useRef<() => void>(() => {})
  const preRef = useRef<HTMLAudioElement | null>(null)
  const errRef = useRef(0)
  const ytOkRef = useRef<boolean | null>(null)
  const autoplayRef = useRef(true)
  const progressRef = useRef(0)
  ytOkRef.current = ytOk
  autoplayRef.current = autoplay
  progressRef.current = progress

  useEffect(() => {
    fetch('/api/like')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ids) setLiked(new Set<string>(d.ids))
      })
      .catch(() => {})
    checkYt().then(setYtOk)
    try {
      if (localStorage.getItem('autoplay') === '0') setAutoplayState(false)
    } catch {}
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 7000)
    return () => clearTimeout(t)
  }, [toast])

  const setAutoplay = useCallback((v: boolean) => {
    setAutoplayState(v)
    try {
      localStorage.setItem('autoplay', v ? '1' : '0')
    } catch {}
  }, [])

  // YouTube songs cannot play when YouTube is unreachable from the visitor's network
  const playable = useCallback((s: Song) => !!s.src || ytOkRef.current !== false, [])

  const start = useCallback((s: Song) => {
    currentRef.current = s
    setCurrent(s)
    setProgress(0)
    setDuration(0)
    const a = audioRef.current
    if (s.src) {
      // Free track: plain HTML5 audio, no YouTube involved
      try {
        player.current?.pauseVideo?.()
      } catch {}
      if (a) {
        a.src = s.src
        a.play().catch(() => {})
      }
    } else {
      if (a && !a.paused) a.pause()
      if (ready.current && player.current) player.current.loadVideoById(s.id)
    }
    // Preload the next free track so the switch is instant
    const q = queue.current
    const idx = q.findIndex((x) => x.id === s.id)
    const n = idx >= 0 ? q[idx + 1] : undefined
    if (n?.src) {
      try {
        const pre = new Audio()
        pre.preload = 'auto'
        pre.src = n.src
        preRef.current = pre
      } catch {}
    }
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, title: s.title, artist: s.artist, thumb: s.thumb }),
    }).catch(() => {})
    sendTrack({
      type: 'play',
      path: typeof location !== 'undefined' ? location.pathname : '/',
      song_id: s.id,
      song_title: s.title,
      song_artist: s.artist,
      song_source: s.src ? 'free' : 'youtube',
    })
  }, [])

  // When the queue ends, keep going with similar songs (autoplay)
  const continueAuto = useCallback(async () => {
    const c = currentRef.current
    if (!c || !autoplayRef.current) {
      setPlaying(false)
      return
    }
    try {
      const q = new URLSearchParams({ id: c.id, artist: c.artist, title: c.title })
      const r = await fetch(`/api/related?${q.toString()}`)
      const d = r.ok ? await r.json() : { songs: [] }
      const have = new Set(queue.current.map((x) => x.id))
      const more: Song[] = ((d.songs ?? []) as Song[]).filter((x) => !have.has(x.id) && playable(x))
      if (more.length && currentRef.current?.id === c.id) {
        const list = [...queue.current, ...more]
        queue.current = list
        setQueueList(list)
        start(more[0])
        return
      }
    } catch {}
    setPlaying(false)
  }, [start, playable])

  const step = useCallback(
    (dir: number) => {
      const q = queue.current
      const c = currentRef.current
      // "Previous" restarts the song when it is already past 3 seconds
      if (dir < 0 && progressRef.current > 3 && c) {
        if (c.src) {
          if (audioRef.current) audioRef.current.currentTime = 0
        } else {
          player.current?.seekTo(0, true)
        }
        setProgress(0)
        return
      }
      const i = q.findIndex((x) => x.id === c?.id)
      for (let j = i + dir; j >= 0 && j < q.length; j += dir) {
        if (playable(q[j])) {
          start(q[j])
          return
        }
      }
      if (dir > 0) continueAuto()
    },
    [start, playable, continueAuto]
  )
  const stepRef = useRef(step)
  stepRef.current = step

  // A track failed to load: skip to the next one, but give up after a few failures in a row
  failRef.current = () => {
    errRef.current += 1
    if (errRef.current > 4) {
      setPlaying(false)
      return
    }
    stepRef.current(1)
  }

  // Create the official YouTube player the first time a YouTube song is chosen
  useEffect(() => {
    if (!current || current.src || player.current) return
    const initialId = current.id
    const create = () => {
      if (player.current || !host.current) return
      const el = document.createElement('div')
      host.current.innerHTML = ''
      host.current.appendChild(el)
      player.current = new window.YT.Player(el, {
        width: '100%',
        height: '100%',
        videoId: initialId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            ready.current = true
            const c = currentRef.current
            if (!c) return
            if (c.src) player.current.stopVideo()
            else if (c.id !== initialId) player.current.loadVideoById(c.id)
          },
          onStateChange: (e: any) => {
            if (currentRef.current?.src) return
            const S = window.YT.PlayerState
            if (e.data === S.PLAYING) {
              errRef.current = 0
              setPlaying(true)
              setDuration(player.current.getDuration() || 0)
            } else if (e.data === S.PAUSED) {
              setPlaying(false)
            } else if (e.data === S.ENDED) {
              stepRef.current(1)
            }
          },
          onError: () => {
            if (!currentRef.current?.src) failRef.current()
          },
        },
      })
    }
    if (window.YT?.Player) {
      create()
    } else {
      window.onYouTubeIframeAPIReady = create
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }
  }, [current])

  useEffect(() => {
    if (!playing || !current || current.src) return
    const t = setInterval(() => {
      try {
        setProgress(player.current?.getCurrentTime() || 0)
      } catch {}
    }, 500)
    return () => clearInterval(t)
  }, [playing, current])

  useEffect(() => {
    if (current) document.title = `${current.title} · Ekko Music`
  }, [current])

  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [expanded])

  // Lock-screen / hardware media key controls
  useEffect(() => {
    if (!current || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        artwork: current.thumb ? [{ src: current.thumb, sizes: '320x180', type: 'image/jpeg' }] : [],
      })
      navigator.mediaSession.setActionHandler('play', () => toggleRef.current())
      navigator.mediaSession.setActionHandler('pause', () => toggleRef.current())
      navigator.mediaSession.setActionHandler('nexttrack', () => stepRef.current(1))
      navigator.mediaSession.setActionHandler('previoustrack', () => stepRef.current(-1))
    } catch {}
  }, [current])

  const play = useCallback(
    (s: Song, q?: Song[]) => {
      if (!playable(s)) {
        setToast({
          text: "YouTube isn't reachable from your network, so this song can't play here. Free tracks play normally.",
          q: s.artist,
        })
        return
      }
      const list = q && q.length ? q : [s]
      queue.current = list
      setQueueList(list)
      errRef.current = 0
      start(s)
    },
    [start, playable]
  )

  const toggle = useCallback(() => {
    const c = currentRef.current
    if (c?.src) {
      const a = audioRef.current
      if (!a) return
      if (a.paused) a.play().catch(() => {})
      else a.pause()
      return
    }
    if (!player.current || !ready.current) return
    if (playing) player.current.pauseVideo()
    else player.current.playVideo()
  }, [playing])
  toggleRef.current = toggle

  const seek = useCallback((t: number) => {
    if (currentRef.current?.src) {
      if (audioRef.current) audioRef.current.currentTime = t
    } else {
      player.current?.seekTo(t, true)
    }
    setProgress(t)
  }, [])

  const stop = useCallback(() => {
    try {
      player.current?.stopVideo()
    } catch {}
    audioRef.current?.pause()
    currentRef.current = null
    setCurrent(null)
    setPlaying(false)
    setExpanded(false)
  }, [])

  const toggleLike = useCallback(
    async (s: Song) => {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, title: s.title, artist: s.artist, thumb: s.thumb }),
      })
      if (res.status === 401) {
        router.push('/login?next=/')
        return
      }
      if (!res.ok) return
      const d = await res.json()
      setLiked((prev) => {
        const n = new Set(prev)
        if (d.liked) n.add(s.id)
        else n.delete(s.id)
        return n
      })
    },
    [router]
  )

  return (
    <PlayerContext.Provider
      value={{
        current,
        playing,
        progress,
        duration,
        liked,
        queue: queueList,
        expanded,
        setExpanded,
        autoplay,
        setAutoplay,
        ytOk,
        play,
        toggle,
        next: () => step(1),
        prev: () => step(-1),
        seek,
        stop,
        toggleLike,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => {
          if (currentRef.current?.src) setPlaying(true)
        }}
        onPlaying={() => {
          errRef.current = 0
        }}
        onPause={() => {
          if (currentRef.current?.src) setPlaying(false)
        }}
        onEnded={() => {
          if (currentRef.current?.src) stepRef.current(1)
        }}
        onTimeUpdate={(e) => {
          if (currentRef.current?.src) setProgress(e.currentTarget.currentTime)
        }}
        onLoadedMetadata={(e) => {
          if (currentRef.current?.src) setDuration(e.currentTarget.duration || 0)
        }}
        onError={() => {
          if (currentRef.current?.src) failRef.current()
        }}
      />
      <div
        className={
          'video-panel' + (current && !current.src ? '' : ' hidden') + (expanded ? ' expanded' : '')
        }
      >
        <div className="video-head">
          <span>Now playing (YouTube)</span>
          <button onClick={stop} aria-label="Close player">
            ✕
          </button>
        </div>
        <div ref={host} className="video-host" />
      </div>
      <NowPlaying />
      <PlayerBar />
      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.q && (
            <button
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(toast.q as string)}`)
                setToast(null)
              }}
            >
              Find free songs
            </button>
          )}
          <button aria-label="Dismiss" onClick={() => setToast(null)}>
            ✕
          </button>
        </div>
      )}
    </PlayerContext.Provider>
  )
}
