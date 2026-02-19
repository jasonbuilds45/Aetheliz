import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'

const ROLE_DESTINATIONS: Record<UserRole, string> = {
  principal: '/b2b/principal',
  teacher:   '/b2b/teacher',
  student:   '/b2c',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WorkspaceRouter() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/auth/login')
  }

  if (profile.role === 'principal' && !profile.tenant_id) {
    redirect('/workspace/setup/wizard')
  }

  const destination = ROLE_DESTINATIONS[profile.role as UserRole]

  if (!destination) {
    redirect('/auth/login')
  }

  redirect(destination)
}
