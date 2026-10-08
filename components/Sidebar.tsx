'use client'
import Link from 'next/link'
import type { Me, Pl } from '@/lib/types'
import { Icon } from './Icons'

const NAV = [
  { href: '/', label: 'Home', icon: 'home' as const },
  { href: '/explore', label: 'Explore', icon: 'explore' as const },
  { href: '/library', label: 'Library', icon: 'library' as const },
]

export default function Sidebar({
  me,
  playlists,
  path,
  onToggle,
}: {
  me: Me | null
  playlists: Pl[]
  path: string
  onToggle: () => void
}) {
  const on = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'))
  return (
    <aside className="side">
      <div className="side-top">
        <button className="icon-btn" onClick={onToggle} aria-label="Collapse or expand the menu">
          <Icon name="menu" outline />
        </button>
        <Link href="/" className="logo">
          <i>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </i>
          <span className="lbl">Ekko Music</span>
        </Link>
      </div>

      <nav className="side-nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} title={n.label} className={'side-link' + (on(n.href) ? ' on' : '')}>
            <Icon name={n.icon} outline />
            <span className="lbl">{n.label}</span>
          </Link>
        ))}
      </nav>

      <Link href="/library?tab=playlists" className="side-new" title="New playlist">
        <Icon name="plus" outline />
        <span className="lbl">New playlist</span>
      </Link>

      <div className="side-lists">
        {me && (
          <Link href="/library?tab=songs" className="side-pl" title="Liked songs">
            <span className="pl-ic liked">♥</span>
            <span className="lbl">Liked songs</span>
          </Link>
        )}
        {playlists.map((p) => (
          <Link
            key={p.id}
            href={`/playlist/${p.id}`}
            title={p.name}
            className={'side-pl' + (path === `/playlist/${p.id}` ? ' on' : '')}
          >
            <span className="pl-ic">{p.name.slice(0, 1).toUpperCase()}</span>
            <span className="lbl">{p.name}</span>
          </Link>
        ))}
        {!me && <p className="side-hint lbl">Sign in to save songs and build playlists.</p>}
      </div>

      <div className="side-foot">
        {me?.isAdmin && (
          <Link href="/admin" title="Admin" className={'side-link' + (on('/admin') ? ' on' : '')}>
            <Icon name="shield" outline />
            <span className="lbl">Admin</span>
          </Link>
        )}
        <Link href="/settings" title="Settings" className={'side-link' + (on('/settings') ? ' on' : '')}>
          <Icon name="settings" outline />
          <span className="lbl">Settings</span>
        </Link>
      </div>
    </aside>
  )
}
