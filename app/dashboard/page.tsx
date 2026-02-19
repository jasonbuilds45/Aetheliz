import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'

export default async function DashboardRouter() {
  const cookieStore = cookies()

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

  // ─────────────────────────────────────────────
  // 1️⃣ Ensure authentication
  // ─────────────────────────────────────────────
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Fetch profile
  // ─────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/auth/login')
  }

  const role = profile.role as UserRole

  // ─────────────────────────────────────────────
  // 3️⃣ Principal onboarding enforcement
  // ─────────────────────────────────────────────
  if (role === 'principal') {
    if (!profile.tenant_id) {
      redirect('/workspace/setup/wizard')
    }

    redirect('/b2b/principal')
  }

  // ─────────────────────────────────────────────
  // 4️⃣ Teacher routing
  // ─────────────────────────────────────────────
  if (role === 'teacher') {
    redirect('/b2b/teacher')
  }

  // ─────────────────────────────────────────────
  // 5️⃣ Student calibration enforcement
  // ─────────────────────────────────────────────
  if (role === 'student') {
    const { data: settings } = await supabase
      .from('student_settings')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!settings) {
      redirect('/b2c/onboarding')
    }

    redirect('/b2c')
  }

  // ─────────────────────────────────────────────
  // 6️⃣ Fallback (should never happen)
  // ─────────────────────────────────────────────
  redirect('/auth/login')
}