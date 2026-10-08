import './globals.css'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Me, Pl } from '@/lib/types'
import PlayerProvider from '@/components/PlayerProvider'
import Tracker from '@/components/Tracker'
import Shell from '@/components/Shell'

export const metadata: Metadata = {
  title: 'Ekko Music',
  description: 'Fresh music, free tracks and YouTube picks',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let me: Me | null = null
  let playlists: Pl[] = []
  if (user) {
    const [adm, pls] = await Promise.all([
      supabase.rpc('is_admin'),
      supabase.from('playlists').select('id,name').order('created_at', { ascending: false }).limit(20),
    ])
    const meta: any = user.user_metadata ?? {}
    me = {
      name: meta.full_name || meta.name || user.email?.split('@')[0] || '',
      email: user.email ?? '',
      avatar: meta.avatar_url || meta.picture || undefined,
      isAdmin: adm.data === true,
    }
    playlists = (pls.data ?? []) as Pl[]
  }

  return (
    <html lang="en">
      <body>
        <PlayerProvider>
          <Tracker />
          <Shell me={me} playlists={playlists}>
            {children}
          </Shell>
        </PlayerProvider>
      </body>
    </html>
  )
}
