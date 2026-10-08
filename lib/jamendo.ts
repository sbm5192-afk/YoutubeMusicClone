import type { Song } from './types'

const BASE = 'https://api.jamendo.com/v3.0'

function toSong(t: any): Song | null {
  if (!t?.id || !t.audio) return null
  return {
    id: `jm:${t.id}`,
    title: String(t.name ?? ''),
    artist: String(t.artist_name ?? ''),
    thumb: t.image || t.album_image || '',
    src: t.audio,
    license: t.license_ccurl || undefined,
  }
}

async function tracks(params: Record<string, string>, revalidate = 3600): Promise<Song[]> {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) return []
  const url = new URL(`${BASE}/tracks/`)
  const all: Record<string, string> = {
    client_id: clientId,
    format: 'json',
    limit: '14',
    audioformat: 'mp32',
    imagesize: '300',
    ...params,
  }
  Object.entries(all).forEach(([k, v]) => url.searchParams.set(k, v))
  try {
    const res = await fetch(url.toString(), { next: { revalidate } })
    if (!res.ok) {
      console.error('Jamendo API error', res.status)
      return []
    }
    const data = await res.json()
    return ((data?.results ?? []) as any[]).map(toSong).filter(Boolean) as Song[]
  } catch (e) {
    console.error('Jamendo fetch failed', e)
    return []
  }
}

export const jamendoNew = (limit = 14) => tracks({ order: 'releasedate_desc', limit: String(limit) })
export const jamendoHot = (limit = 14) => tracks({ order: 'popularity_week', limit: String(limit) })
export const jamendoTag = (tag: string, limit = 14) =>
  tracks({ order: 'popularity_week', tags: tag, limit: String(limit) })
export const jamendoSearch = (q: string, limit = 24) => tracks({ search: q, limit: String(limit) }, 600)
export const jamendoByArtist = (artist: string, limit = 14) =>
  tracks({ artist_name: artist, order: 'popularity_total', limit: String(limit) }, 3600)
export const jamendoByIds = (ids: string[]) =>
  ids.length ? tracks({ id: ids.join('+'), limit: String(Math.min(ids.length, 50)) }, 600) : Promise.resolve([])
