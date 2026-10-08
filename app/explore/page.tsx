import Link from 'next/link'
import { searchSongs, trendingSongs } from '@/lib/youtube'
import { jamendoHot, jamendoNew } from '@/lib/jamendo'
import { GENRES, MOODS } from '@/lib/genres'
import Row from '@/components/Row'
import ChartList from '@/components/ChartList'
import YtGate from '@/components/YtGate'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Explore · Ekko Music' }

export default async function Explore() {
  // Same queries as the home page, so the cached results are reused and no extra YouTube quota is spent
  const [ytFresh, ytTrending, freeNew, freeHot] = await Promise.all([
    searchSongs('new song', 14, { days: 2 }),
    trendingSongs(12),
    jamendoNew(14),
    jamendoHot(14),
  ])

  return (
    <div>
      <div className="shortcuts">
        <a href="#new">New releases</a>
        <a href="#charts">Charts</a>
        <a href="#moods">Moods &amp; genres</a>
      </div>

      <div id="new">
        <Row big title="New releases · free" songs={freeNew} />
        <YtGate notice={ytFresh.length > 0}>
          <Row title="Fresh on YouTube · last 48 hours" songs={ytFresh} />
        </YtGate>
      </div>

      <h2 className="sec-title" id="charts">
        Charts
      </h2>
      <div className="charts">
        <ChartList title="Top free tracks this week" songs={freeHot} />
        <ChartList title="Trending on YouTube" songs={ytTrending} />
      </div>

      <h2 className="sec-title" id="moods">
        Moods &amp; genres
      </h2>
      <div className="moods">
        {MOODS.map((m) => (
          <Link
            key={m.label}
            href={`/search?q=${encodeURIComponent(m.q)}`}
            className="mood"
            style={{ ['--from' as any]: m.from, ['--to' as any]: m.to }}
          >
            {m.label}
          </Link>
        ))}
      </div>
      <div className="genres" style={{ marginTop: 18 }}>
        {GENRES.map((g) => (
          <Link key={g} href={`/search?q=${encodeURIComponent(g)}`} className="genre">
            {g}
          </Link>
        ))}
      </div>
    </div>
  )
}
