import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsView from '@/components/SettingsView'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings · Ekko Music' }

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/settings')

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('genres,artists')
    .eq('user_id', user.id)
    .maybeSingle()

  const meta: any = user.user_metadata ?? {}
  return (
    <SettingsView
      email={user.email ?? ''}
      name={meta.full_name || meta.name || (user.email ?? '').split('@')[0]}
      avatar={meta.avatar_url || meta.picture || undefined}
      provider={(user.app_metadata as any)?.provider ?? 'email'}
      genres={(prefs as any)?.genres ?? []}
      artists={(prefs as any)?.artists ?? []}
    />
  )
}
