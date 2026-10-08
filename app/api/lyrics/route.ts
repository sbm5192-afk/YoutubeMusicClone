import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Lyrics are only served for free (Creative Commons) Jamendo tracks.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!/^jm:\d{1,12}$/.test(id) || !clientId) return NextResponse.json({ lyrics: null })
  const url =
    'https://api.jamendo.com/v3.0/tracks/lyrics/?format=json&client_id=' +
    encodeURIComponent(clientId) +
    '&id=' +
    id.slice(3)
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return NextResponse.json({ lyrics: null })
    const data = await res.json()
    const l = data?.results?.[0]?.lyrics
    return NextResponse.json({ lyrics: typeof l === 'string' && l.trim() ? l : null })
  } catch {
    return NextResponse.json({ lyrics: null })
  }
}
