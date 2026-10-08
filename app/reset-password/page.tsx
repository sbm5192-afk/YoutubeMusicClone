'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPassword() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setHasSession(!!data.session))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setBusy(true)
    const { error } = await createClient().auth.updateUser({ password })
    if (error) setError(error.message)
    else {
      setDone(true)
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1200)
    }
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Choose a new password</h1>
        {hasSession === false ? (
          <>
            <div className="auth-msg err">This reset link is invalid or has expired. Please request a new one.</div>
            <Link href="/forgot-password" className="btn wide">
              Request a new link
            </Link>
          </>
        ) : done ? (
          <div className="auth-msg ok">Password updated. Taking you to the home page...</div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
            <input
              type="password"
              placeholder="Repeat the new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
            {error && <div className="auth-msg err">{error}</div>}
            <button className="btn wide" disabled={busy || hasSession === null}>
              {busy ? 'Please wait...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
