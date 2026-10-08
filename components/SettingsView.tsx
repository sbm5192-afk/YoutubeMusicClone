'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GENRES } from '@/lib/genres'
import { usePlayer } from './PlayerContext'

type Props = {
  email: string
  name: string
  avatar?: string
  provider: string
  genres: string[]
  artists: string[]
}
type Flash = { k: string; ok: boolean; text: string } | null

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="set-card">
      <h2>{title}</h2>
      {desc && <p className="set-desc">{desc}</p>}
      {children}
    </section>
  )
}

export default function SettingsView({ email, name, avatar, provider, genres, artists }: Props) {
  const router = useRouter()
  const player = usePlayer()
  const [displayName, setDisplayName] = useState(name)
  const [picked, setPicked] = useState<string[]>(genres)
  const [artistText, setArtistText] = useState(artists.join(', '))
  const [newPw, setNewPw] = useState('')
  const [busy, setBusy] = useState('')
  const [flash, setFlash] = useState<Flash>(null)

  const say = (k: string, ok: boolean, text: string) => setFlash({ k, ok, text })
  const F = ({ k }: { k: string }) =>
    flash && flash.k === k ? <div className={'flash ' + (flash.ok ? 'ok' : 'err')}>{flash.text}</div> : null

  async function saveProfile() {
    setBusy('profile')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const n = displayName.trim().slice(0, 60)
    const [a, b] = await Promise.all([
      supabase.auth.updateUser({ data: { full_name: n } }),
      supabase.from('profiles').update({ full_name: n }).eq('id', user.id),
    ])
    if (a.error || b.error) say('profile', false, 'Could not save your name.')
    else {
      say('profile', true, 'Saved.')
      router.refresh()
    }
    setBusy('')
  }

  async function savePrefs() {
    setBusy('prefs')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: user.id,
      genres: picked,
      artists: artistText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 5),
      updated_at: new Date().toISOString(),
    })
    if (error) say('prefs', false, 'Could not save your taste.')
    else {
      say('prefs', true, 'Saved. Your home page will use these from now on.')
      router.refresh()
    }
    setBusy('')
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy('pw')
    const { error } = await createClient().auth.updateUser({ password: newPw })
    if (error) say('pw', false, error.message)
    else {
      say('pw', true, 'Password updated.')
      setNewPw('')
    }
    setBusy('')
  }

  async function clearHistory() {
    if (!confirm('Clear your whole listening history?')) return
    setBusy('hist')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('play_history').delete().eq('user_id', user.id)
    say('hist', !error, error ? 'Could not clear the history.' : 'Listening history cleared.')
    if (!error) router.refresh()
    setBusy('')
  }

  async function clearLikes() {
    if (!confirm('Remove all your liked songs?')) return
    setBusy('likes')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('liked_songs').delete().eq('user_id', user.id)
    say('likes', !error, error ? 'Could not remove your likes.' : 'All liked songs removed.')
    if (!error) router.refresh()
    setBusy('')
  }

  return (
    <div className="set">
      <h1>Settings</h1>

      <Card title="Account" desc={`Signed in with ${provider === 'email' ? 'email and password' : provider}.`}>
        <div className="set-profile">
          <span className="avatar big">
            {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : (displayName || email).slice(0, 1).toUpperCase()}
          </span>
          <div className="set-fields">
            <label>
              Display name
              <input className="set-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} />
            </label>
            <label>
              Email
              <input className="set-input" value={email} readOnly />
            </label>
          </div>
        </div>
        <div className="set-actions">
          <button className="btn" onClick={saveProfile} disabled={busy === 'profile'}>
            Save
          </button>
          <form action="/auth/signout" method="post">
            <button className="btn-ghost">Sign out</button>
          </form>
        </div>
        <F k="profile" />
      </Card>

      <Card title="Your music taste" desc="Genres and artists shape the rows on your home page.">
        <div className="pick">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={'chip' + (picked.includes(g) ? ' on' : '')}
              onClick={() => setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))}
            >
              {g}
            </button>
          ))}
        </div>
        <label className="set-label">
          Favorite artists (separated by commas)
          <input className="set-input" value={artistText} onChange={(e) => setArtistText(e.target.value)} />
        </label>
        <div className="set-actions">
          <button className="btn" onClick={savePrefs} disabled={busy === 'prefs'}>
            Save taste
          </button>
        </div>
        <F k="prefs" />
      </Card>

      <Card title="Playback">
        <div className="set-row first">
          <div>
            <b>Autoplay</b>
            <div className="set-desc" style={{ margin: 0 }}>
              When your queue ends, keep playing similar songs.
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={player.autoplay} onChange={(e) => player.setAutoplay(e.target.checked)} />
            <i />
          </label>
        </div>
      </Card>

      <Card title="Privacy and data">
        <div className="set-row first">
          <div>
            <b>Listening history</b>
            <div className="set-desc" style={{ margin: 0 }}>
              Removes the list of songs you played.
            </div>
          </div>
          <button className="btn-ghost btn-danger" onClick={clearHistory} disabled={busy === 'hist'}>
            Clear
          </button>
        </div>
        <F k="hist" />
        <div className="set-row">
          <div>
            <b>Liked songs</b>
            <div className="set-desc" style={{ margin: 0 }}>
              Removes all songs you liked.
            </div>
          </div>
          <button className="btn-ghost btn-danger" onClick={clearLikes} disabled={busy === 'likes'}>
            Remove all
          </button>
        </div>
        <F k="likes" />
      </Card>

      {provider === 'email' && (
        <Card title="Password">
          <form onSubmit={changePassword} className="set-actions" style={{ marginTop: 0 }}>
            <input
              className="set-input"
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
              style={{ maxWidth: 320 }}
            />
            <button className="btn" disabled={busy === 'pw'}>
              Change password
            </button>
          </form>
          <F k="pw" />
        </Card>
      )}

      <Card title="About">
        <p className="set-desc" style={{ margin: 0, lineHeight: 1.7 }}>
          Ekko Music. Free tracks come from Jamendo under Creative Commons licenses, with the license link shown on every
          track. YouTube songs are played with the official YouTube player.
        </p>
      </Card>
    </div>
  )
}
