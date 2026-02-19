import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function DashboardDebug() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <pre>No session</pre>
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  return (
    <pre>
      {JSON.stringify(
        {
          sessionExists: true,
          userId: session.user.id,
          profile,
          error
        },
        null,
        2
      )}
    </pre>
  )
}