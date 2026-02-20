import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function SettingsRouter() {
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

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role === "student") {
    redirect("/settings/student")
  }

  if (profile.role === "principal") {
    redirect("/settings/principal")
  }

  if (profile.role === "teacher") {
    redirect("/settings/teacher")
  }

  redirect("/dashboard")
}