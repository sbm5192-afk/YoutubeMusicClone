'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewPlaylist() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setBusy(true)
    setErr('')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/library')
      return
    }
    const { data, error } = await supabase
      .from('playlists')
      .insert({ name: n.slice(0, 80), user_id: user.id })
      .select('id')
      .single()
    if (error || !data) setErr('Could not create the playlist. Please try again.')
    else {
      setName('')
      router.push(`/playlist/${(data as { id: string }).id}`)
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <form onSubmit={create} className="newpl">
      <input
        className="set-input"
        placeholder="New playlist name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <button className="btn" disabled={busy || !name.trim()}>
        Create
      </button>
      {err && <span className="flash err">{err}</span>}
    </form>
  )
}
