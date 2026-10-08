'use client'
import { createContext, useContext } from 'react'
import type { Song } from '@/lib/types'

export type PlayerCtx = {
  current: Song | null
  playing: boolean
  progress: number
  duration: number
  liked: Set<string>
  queue: Song[]
  expanded: boolean
  setExpanded: (v: boolean) => void
  autoplay: boolean
  setAutoplay: (v: boolean) => void
  ytOk: boolean | null
  play: (s: Song, queue?: Song[]) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (t: number) => void
  stop: () => void
  toggleLike: (s: Song) => Promise<void>
}

export const PlayerContext = createContext<PlayerCtx>(null as unknown as PlayerCtx)
export const usePlayer = () => useContext(PlayerContext)
