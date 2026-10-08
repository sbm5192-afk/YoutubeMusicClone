'use client'
import { useEffect, useState } from 'react'
import { checkYt } from '@/lib/ytprobe'

// Always shows its children (YouTube covers load through our own image route).
// When YouTube is unreachable for this visitor and `notice` is set, it adds an explanation banner above them.
export default function YtGate({ children, notice = false }: { children: React.ReactNode; notice?: boolean }) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    checkYt().then((v) => {
      if (alive) setOk(v)
    })
    return () => {
      alive = false
    }
  }, [])
  return (
    <>
      {ok === false && notice && (
        <div className="notice soft">
          YouTube is not reachable from your network. You can still browse the newest and fastest-rising songs, but only
          free tracks will play.
        </div>
      )}
      {children}
    </>
  )
}
