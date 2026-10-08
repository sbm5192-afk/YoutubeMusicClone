'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function friendly(msg: string) {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('email not confirmed'))
    return 'Please confirm your email first. Check your inbox (and spam folder), or resend the link below.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts or emails sent. Please wait a few minutes and try again.'
  if (m.includes('password should be')) return 'The password must be at least 6 characters.'
  if (m.includes('already registered')) return 'This email is already registered. Try signing in.'
  return msg
}

export default function AuthForm({ next, initialError = '' }: { next: string; initialError?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [info, setInfo] = useState('')
  const [canResend, setCanResend] = useState(false)

  const callback = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function google() {
    setError('')
    setInfo('')
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback(), queryParams: { prompt: 'select_account' } },
    })
    if (error) {
      setError(friendly(error.message))
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    setCanResend(false)
    const supabase = createClient()
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(friendly(error.message))
          if (error.message.toLowerCase().includes('not confirmed')) setCanResend(true)
        } else {
          router.push(next)
          router.refresh()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: callback() },
        })
        if (error) {
          setError(friendly(error.message))
        } else if (data.user && (data.user.identities?.length ?? 1) === 0) {
          setError('This email is already registered. Try signing in instead.')
        } else if (data.session) {
          router.push(next)
          router.refresh()
        } else {
          setInfo(`We sent a confirmation link to ${email}. Open it to finish creating your account, then sign in.`)
          setCanResend(true)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: callback() },
    })
    if (error) setError(friendly(error.message))
    else setInfo(`A new confirmation link was sent to ${email}.`)
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="auth-logo">
          <i>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </i>
          Ekko Music
        </Link>
        <h1>{mode === 'in' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-sub">
          {mode === 'in' ? 'Sign in to get a personalized home page.' : 'Save your likes and get music picked for you.'}
        </p>

        <button type="button" className="g-btn" onClick={google} disabled={busy}>
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </button>

        <div className="divider">
          <span>or use your email</span>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'up' && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={60}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <div className="pw">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              required
            />
            <button type="button" onClick={() => setShow(!show)} aria-label="Show or hide password">
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {mode === 'in' && (
            <Link href="/forgot-password" className="forgot">
              Forgot your password?
            </Link>
          )}
          {error && <div className="auth-msg err">{error}</div>}
          {info && <div className="auth-msg ok">{info}</div>}
          <button className="btn wide" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
          {canResend && email && (
            <button type="button" className="link" onClick={resend} disabled={busy}>
              Resend confirmation email
            </button>
          )}
        </form>

        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in')
            setError('')
            setInfo('')
            setCanResend(false)
          }}
        >
          {mode === 'in' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
