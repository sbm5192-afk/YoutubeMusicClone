import { jamendoByIds } from './jamendo'
import type { Song } from './types'

type Row = { id: string; title: string; artist: string; thumb: string }

// Free tracks are stored by id only; their audio URLs are looked up again from Jamendo when needed.
export async function hydrate(rows: Row[]): Promise<Song[]> {
  const ids = rows.filter((r) => r.id.startsWith('jm:')).map((r) => r.id.slice(3))
  const found = new Map<string, Song>()
  for (const s of await jamendoByIds(ids)) found.set(s.id, s)
  const out: Song[] = []
  for (const r of rows) {
    if (r.id.startsWith('jm:')) {
      const s = found.get(r.id)
      if (s) out.push(s)
    } else {
      out.push(r)
    }
  }
  return out
}
