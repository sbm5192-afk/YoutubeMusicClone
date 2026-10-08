'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { sendTrack } from '@/lib/track'

// Sends one page-view event per client-side navigation (admin pages are not tracked)
export default function Tracker() {
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    let referrer = ''
    if (first.current) {
      try {
        if (document.referrer) {
          const u = new URL(document.referrer)
          if (u.host !== location.host) referrer = u.host
        }
      } catch {}
    }
    first.current = false
    sendTrack({ type: 'view', path: pathname, referrer })
  }, [pathname])
  return null
}
