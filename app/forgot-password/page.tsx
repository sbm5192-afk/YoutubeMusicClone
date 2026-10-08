'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p className="auth-sub">Enter your email and we will send you a link to choose a new password.</p>
        {sent ? (
          <div className="auth-msg ok">If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.</div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <div className="auth-msg err">{error}</div>}
            <button className="btn wide" disabled={busy}>
              {busy ? 'Please wait...' : 'Send reset link'}
            </button>
          </form>
        )}
        <Link href="/login" className="link">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
