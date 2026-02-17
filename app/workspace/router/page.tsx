import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'

const ROLE_DESTINATIONS: Record<UserRole, string> = {
  principal: '/b2b/principal',
  teacher:   '/b2b/teacher',
  student:   '/b2c',
}

export default async function WorkspaceRouter() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', session.user.id)
    .single()

  // No profile row at all → back to login
  if (error || !profile) {
    redirect('/auth/login')
  }

  const destination = ROLE_DESTINATIONS[profile.role as UserRole]

  // Valid role but no tenant yet (principal who hasn't finished setup)
  // Only send to wizard if they genuinely have no tenant linked
  if (!destination) {
    redirect('/auth/login')
  }

  // Principal with no tenant_id still needs to complete setup
  if (profile.role === 'principal' && !profile.tenant_id) {
    redirect('/workspace/setup/wizard')
  }

  redirect(destination)
}
