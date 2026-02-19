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
  // 1️⃣ Ensure user is authenticated
  // ─────────────────────────────────────────────
  const { data: { session } } = await supabase.auth.getSession()

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
  // 3️⃣ Enforce onboarding for principals
  // ─────────────────────────────────────────────
  if (role === 'principal' && !profile.tenant_id) {
    redirect('/workspace/setup/wizard')
  }

  // ─────────────────────────────────────────────
  // 4️⃣ Deterministic routing by role
  // ─────────────────────────────────────────────
  if (role === 'principal') {
    redirect('/b2b/principal')
  }

  if (role === 'teacher') {
    redirect('/b2b/teacher')
  }

  if (role === 'student') {
    redirect('/b2c')
  }

  // ─────────────────────────────────────────────
  // 5️⃣ Fallback (should never happen)
  // ─────────────────────────────────────────────
  redirect('/auth/login')
}