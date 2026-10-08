'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Me } from '@/lib/types'
import { Icon } from './Icons'

export default function TopBar({ me }: { me: Me | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', down)
    window.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      window.removeEventListener('keydown', key)
    }
  }, [])

  return (
    <header className="header">
      <Link href="/" className="logo top-logo" aria-label="Home">
        <i>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
            <path d="M8 5v14l11-7z" />
          </svg>
        </i>
      </Link>
      <form action="/search" className="search">
        <Icon name="search" outline />
        <input name="q" placeholder="Search songs, artists" autoComplete="off" />
      </form>
      <div className="nav">
        {me ? (
          <div className="menu" ref={ref}>
            <button className="avatar" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open}>
              {me.avatar ? <img src={me.avatar} alt="" referrerPolicy="no-referrer" /> : me.name.slice(0, 1).toUpperCase()}
            </button>
            {open && (
              <div className="menu-pop">
                <div className="menu-user">
                  <b>{me.name}</b>
                  <span>{me.email}</span>
                </div>
                <Link href="/library" className="menu-item" onClick={() => setOpen(false)}>
                  <Icon name="library" outline />
                  Library
                </Link>
                <Link href="/settings" className="menu-item" onClick={() => setOpen(false)}>
                  <Icon name="settings" outline />
                  Settings
                </Link>
                {me.isAdmin && (
                  <Link href="/admin" className="menu-item" onClick={() => setOpen(false)}>
                    <Icon name="shield" outline />
                    Admin dashboard
                  </Link>
                )}
                <form action="/auth/signout" method="post">
                  <button className="menu-item">
                    <Icon name="close" outline />
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="btn">
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
