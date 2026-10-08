import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/safeNext'
import AuthForm from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = safeNext(searchParams.next)
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect(next)
  return <AuthForm next={next} initialError={searchParams.error ?? ''} />
}
