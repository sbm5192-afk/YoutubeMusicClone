import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/safeNext'

// OAuth (Google) and PKCE email links land here with ?code=...
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = safeNext(searchParams.get('next'))
  const err = searchParams.get('error_description') || searchParams.get('error')
  if (err) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(err)}`)

  const code = searchParams.get('code')
  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }
  return NextResponse.redirect(`${origin}${next}`)
}
