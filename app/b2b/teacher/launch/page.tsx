import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function TeacherDashboard() {
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
  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  const { data: classes } = await supabase
    .from('teacher_assignments')
    .select(`
      class_id,
      classes (
        id,
        name,
        academic_year
      )
    `)
    .eq('teacher_id', session.user.id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Classes</h1>

      {classes?.length === 0 && (
        <p className="text-slate-500">No assigned classes.</p>
      )}

      {classes?.map((entry: any) => (
        <div key={entry.class_id} className="border p-4 rounded">
          <h2 className="font-semibold">{entry.classes.name}</h2>
          <p className="text-sm text-slate-500">
            Academic Year: {entry.classes.academic_year}
          </p>

          <a
            href={`/b2b/teacher/launch?classId=${entry.classes.id}`}
            className="inline-block mt-3 bg-primary text-white px-4 py-2 rounded"
          >
            Launch Probe
          </a>
        </div>
      ))}
    </div>
  )
}