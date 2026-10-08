'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Me, Pl } from '@/lib/types'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileNav from './MobileNav'

// Pages that use their own full-screen layout (no navigation drawer)
const BARE = ['/login', '/forgot-password', '/reset-password', '/onboarding']

export default function Shell({
  me,
  playlists,
  children,
}: {
  me: Me | null
  playlists: Pl[]
  children: React.ReactNode
}) {
  const path = usePathname() ?? '/'
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('side_collapsed') === '1')
    } catch {}
  }, [])

  const toggle = () =>
    setCollapsed((c) => {
      const n = !c
      try {
        localStorage.setItem('side_collapsed', n ? '1' : '0')
      } catch {}
      return n
    })

  const bare = BARE.some((p) => path === p || path.startsWith(p + '/'))
  if (bare) return <main className="bare">{children}</main>

  return (
    <div className={'shell' + (collapsed ? ' collapsed' : '')}>
      <Sidebar me={me} playlists={playlists} path={path} onToggle={toggle} />
      <div className="shell-main">
        <TopBar me={me} />
        <main>{children}</main>
        <footer className="footer">
          Free tracks are provided by Jamendo under Creative Commons licenses. Check the license link of each track.
        </footer>
      </div>
      <MobileNav path={path} />
    </div>
  )
}
