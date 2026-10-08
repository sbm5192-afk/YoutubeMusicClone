import { searchSongs } from '@/lib/youtube'
import { jamendoSearch } from '@/lib/jamendo'
import type { Song } from '@/lib/types'
import SongGrid from '@/components/SongGrid'
import YtGate from '@/components/YtGate'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim()
  const [free, yt]: [Song[], Song[]] = q
    ? await Promise.all([jamendoSearch(q), searchSongs(q, 24)])
    : [[], []]
  return (
    <div>
      <h1 className="title">{q ? `Results for "${q}"` : 'Search'}</h1>
      {!q && <p className="empty">Type something in the search box above.</p>}
      {q && !free.length && !yt.length && (
        <p className="empty">No results (or an API quota is used up for today).</p>
      )}
      {free.length > 0 && (
        <>
          <h2 className="title2">Free music</h2>
          <SongGrid songs={free} />
        </>
      )}
      {yt.length > 0 && (
        <YtGate>
          <h2 className="title2">From YouTube</h2>
          <SongGrid songs={yt} />
        </YtGate>
      )}
    </div>
  )
}
