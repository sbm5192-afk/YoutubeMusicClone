'use client'
import Link from 'next/link'
import { Icon } from './Icons'

const ITEMS = [
  { href: '/', label: 'Home', icon: 'home' as const },
  { href: '/explore', label: 'Explore', icon: 'explore' as const },
  { href: '/search', label: 'Search', icon: 'search' as const },
  { href: '/library', label: 'Library', icon: 'library' as const },
]

// Bottom tab bar, only shown on phones
export default function MobileNav({ path }: { path: string }) {
  const on = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'))
  return (
    <nav className="mnav" aria-label="Main">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} className={on(i.href) ? 'on' : ''}>
          <Icon name={i.icon} outline />
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
