import { thumbOf, type Song } from './types'

const BASE = 'https://www.googleapis.com/youtube/v3'

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function cleanArtist(s: string) {
  return decode(s).replace(/ - Topic$/, '').replace(/VEVO$/i, '').trim()
}

// Rounded to the day so the fetch cache key stays stable
function sinceDate(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10) + 'T00:00:00Z'
}

async function yt(path: string, params: Record<string, string>, revalidate: number): Promise<any | null> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    console.error('YOUTUBE_API_KEY is missing')
    return null
  }
  const url = new URL(`${BASE}/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('key', key)
  try {
    const res = await fetch(url.toString(), { next: { revalidate } })
    if (!res.ok) {
      console.error('YouTube API error', res.status, (await res.text()).slice(0, 300))
      return null
    }
    return await res.json()
  } catch (e) {
    console.error('YouTube API fetch failed', e)
    return null
  }
}

// opts.days: only videos published in the last N days, ranked by views (newest + fastest rising).
// Only videos that can be embedded and played outside youtube.com are returned.
export async function searchSongs(
  q: string,
  max = 12,
  opts: { days?: number; order?: string } = {}
): Promise<Song[]> {
  const params: Record<string, string> = {
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    maxResults: String(max),
    q,
  }
  if (opts.days) {
    params.order = opts.order ?? 'viewCount'
    params.publishedAfter = sinceDate(opts.days)
    params.regionCode = process.env.YOUTUBE_REGION || 'US'
  }
  const data = await yt('search', params, 10800)
  return (data?.items ?? [])
    .filter((i: any) => i?.id?.videoId)
    .map((i: any) => ({
      id: i.id.videoId as string,
      title: decode(i.snippet.title),
      artist: cleanArtist(i.snippet.channelTitle),
      thumb: thumbOf(i.id.videoId),
    }))
}

export async function trendingSongs(max = 12): Promise<Song[]> {
  const data = await yt(
    'videos',
    {
      part: 'snippet,status',
      chart: 'mostPopular',
      videoCategoryId: '10',
      regionCode: process.env.YOUTUBE_REGION || 'US',
      maxResults: '25',
    },
    3600
  )
  const songs: Song[] = (data?.items ?? [])
    .filter((i: any) => i?.status?.embeddable !== false)
    .slice(0, max)
    .map((i: any) => ({
      id: i.id as string,
      title: decode(i.snippet.title),
      artist: cleanArtist(i.snippet.channelTitle),
      thumb: thumbOf(i.id),
    }))
  return songs.length ? songs : searchSongs('top hits this week', max, { days: 7 })
}
