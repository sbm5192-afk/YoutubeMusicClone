import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hydrate } from '@/lib/songs'
import { thumbOf } from '@/lib/types'
import PlaylistView from '@/components/PlaylistView'

export const dynamic = 'force-dynamic'

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound()
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent('/playlist/' + params.id)}`)

  const { data: pl } = await supabase.from('playlists').select('id,name').eq('id', params.id).maybeSingle()
  if (!pl) notFound()

  const { data: rows } = await supabase
    .from('playlist_songs')
    .select('song_id,title,artist,thumbnail_url')
    .eq('playlist_id', (pl as any).id)
    .order('added_at', { ascending: true })

  const songs = await hydrate(
    ((rows ?? []) as any[]).map((r) => ({
      id: r.song_id as string,
      title: (r.title ?? '') as string,
      artist: (r.artist ?? '') as string,
      thumb: (String(r.song_id).startsWith('jm:') ? r.thumbnail_url || '' : thumbOf(r.song_id)) as string,
    }))
  )

  return <PlaylistView id={(pl as any).id} name={(pl as any).name} songs={songs} />
}
