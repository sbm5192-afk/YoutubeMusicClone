import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { searchSongs, trendingSongs } from '@/lib/youtube'
import { jamendoHot, jamendoNew, jamendoTag } from '@/lib/jamendo'
import { hydrate } from '@/lib/songs'
import { thumbOf, type Song } from '@/lib/types'
import { GENRE_TAGS, MOODS } from '@/lib/genres'
import Row from '@/components/Row'
import YtGate from '@/components/YtGate'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let genres: string[] = []
  let artists: string[] = []
  const rawRecent: { id: string; title: string; artist: string; thumb: string }[] = []

  if (user) {
    const [prefs, hist] = await Promise.all([
      supabase.from('user_preferences').select('genres,artists').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('play_history')
        .select('video_id,title,artist,thumbnail_url')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(100),
    ])
    if (!prefs.data) redirect('/onboarding')

    genres = prefs.data.genres ?? []
    artists = prefs.data.artists ?? []

    const seen = new Set<string>()
    const counts = new Map<string, number>()
    for (const r of (hist.data ?? []) as any[]) {
      const isFree = String(r.video_id).startsWith('jm:')
      if (!seen.has(r.video_id) && rawRecent.length < 12) {
        seen.add(r.video_id)
        rawRecent.push({
          id: r.video_id,
          title: r.title,
          artist: r.artist ?? '',
          thumb: isFree ? r.thumbnail_url || '' : thumbOf(r.video_id),
        })
      }
      if (r.artist && !isFree) counts.set(r.artist, (counts.get(r.artist) ?? 0) + 1)
    }
    const known = artists.map((a) => a.toLowerCase())
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map((e) => e[0])
      .filter((a) => !known.includes(a.toLowerCase()))
      .slice(0, 2)
    artists = [...artists.slice(0, 3), ...top]
  }

  if (!genres.length) genres = ['Pop', 'Hip Hop', 'Rock']
  genres = genres.slice(0, 3)
  const artistList = artists.slice(0, 4)
  const freePairs = genres.filter((g) => GENRE_TAGS[g]).slice(0, 2).map((g) => ({ g, tag: GENRE_TAGS[g] }))

  const jobs: Song[][] = await Promise.all([
    jamendoNew(14), // 0
    jamendoHot(14), // 1
    hydrate(rawRecent), // 2
    searchSongs('official music video', 14, { days: 7 }), // 3 rising this week
    searchSongs('new song', 14, { days: 2 }), // 4 fresh uploads
    trendingSongs(12), // 5
    ...freePairs.map((p) => jamendoTag(p.tag)), // 6..
    ...artistList.map((a) => searchSongs(`${a} new songs`, 12, { days: 30 })),
    ...genres.map((g) => searchSongs(`${g} music new`, 12, { days: 30 })),
  ])

  const [freeNew, freeHot, recentAll, ytRising, ytFresh, ytTrending] = jobs
  const freeStart = 6
  const artistStart = freeStart + freePairs.length
  const genreStart = artistStart + artistList.length
  const freeRows = freePairs.map((p, i) => ({ title: `${p.g} · free music`, songs: jobs[freeStart + i] }))
  const ytRows: { title: string; songs: Song[] }[] = [
    { title: 'Trending on YouTube', songs: ytTrending },
    { title: 'Listen again (YouTube)', songs: recentAll.filter((s) => !s.src) },
    ...artistList.map((a, i) => ({ title: `New from ${a}`, songs: jobs[artistStart + i] })),
    ...genres.map((g, i) => ({ title: `New ${g} on YouTube`, songs: jobs[genreStart + i] })),
  ]
  const hasFree = [freeNew, freeHot, ...freeRows.map((r) => r.songs)].some((s) => s.length)
  const hasYt = [ytRising, ytFresh, ...ytRows.map((r) => r.songs)].some((s) => s.length)

  return (
    <div>
      <section className="hero">
        <h1>The newest and fastest-rising music, first</h1>
        <p>
          Brand new releases and the songs climbing fastest this week come first. Free tracks play straight from our
          site, and YouTube picks play whenever YouTube is reachable from your network.
        </p>
      </section>
      <div className="chips">
        {MOODS.map((m) => (
          <Link key={m.label} className="chip" href={`/search?q=${encodeURIComponent(m.q)}`}>
            {m.label}
          </Link>
        ))}
      </div>
      {!hasFree && !hasYt && (
        <div className="notice">
          Nothing could be loaded. Check that JAMENDO_CLIENT_ID and YOUTUBE_API_KEY are set on the server and that the daily
          API quota is not used up.
        </div>
      )}
      <YtGate notice={hasYt}>
        <Row big title="Rising on YouTube this week" songs={ytRising} />
        <Row title="Fresh uploads · last 48 hours" songs={ytFresh} />
      </YtGate>
      <Row big title="Brand new · free" songs={freeNew} />
      <Row title="Rising this week · free" songs={freeHot} />
      <Row title="Listen again" songs={recentAll.filter((s) => s.src)} />
      <YtGate>
        {ytRows.map((r) => (
          <Row key={r.title} title={r.title} songs={r.songs} />
        ))}
      </YtGate>
      {freeRows.map((r) => (
        <Row key={r.title} title={r.title} songs={r.songs} />
      ))}
    </div>
  )
}
