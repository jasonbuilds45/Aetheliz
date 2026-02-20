import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")

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

  const { data } = await supabase
    .from("probe_sessions")
    .select("stability_score, metadata")
    .eq("id", id)
    .single()

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    overall_score: data.stability_score,
    nodes: data.metadata?.results || []
  })
}