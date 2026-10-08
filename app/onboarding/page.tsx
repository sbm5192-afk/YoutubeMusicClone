'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GENRES } from '@/lib/genres'

export default function Onboarding() {
  const router = useRouter()
  const [picked, setPicked] = useState<string[]>([])
  const [artists, setArtists] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (g: string) => setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))

  async function save(skip: boolean) {
    setBusy(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      genres: skip ? [] : picked,
      artists: skip
        ? []
        : artists
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
            .slice(0, 5),
      updated_at: new Date().toISOString(),
    })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth" style={{ maxWidth: 640 }}>
      <h1>What do you like to listen to?</h1>
      <p className="empty" style={{ margin: 0 }}>
        Pick a few genres. We use them to build your home page. You can change them later in Settings.
      </p>
      <div className="pick">
        {GENRES.map((g) => (
          <button key={g} type="button" className={'chip' + (picked.includes(g) ? ' on' : '')} onClick={() => toggle(g)}>
            {g}
          </button>
        ))}
      </div>
      <input
        placeholder="Favorite artists, separated by commas (optional)"
        value={artists}
        onChange={(e) => setArtists(e.target.value)}
      />
      <button className="btn" disabled={busy} onClick={() => save(false)}>
        Continue
      </button>
      <button className="link" disabled={busy} onClick={() => save(true)}>
        Skip for now
      </button>
    </div>
  )
}
