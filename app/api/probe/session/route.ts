import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("id")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 })
  }

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
        remove() {}
      }
    }
  )

  const { data, error } = await supabase
    .from("probe_sessions")
    .select("metadata")
    .eq("id", sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json({
    probes: data.metadata?.probes || []
  })
}