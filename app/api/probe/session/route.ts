import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session id" },
        { status: 400 }
      )
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

    // 🔐 Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔎 Fetch full session
    const { data: session, error } = await supabase
      .from("probe_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    // 🔒 Ensure session belongs to user
    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      stability_score: session.stability_score || 0,
      metadata: {
        topic: session.metadata?.topic || "",
        probes: session.metadata?.probes || [],
        results: session.metadata?.results || []
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Session retrieval failed" },
      { status: 500 }
    )
  }
}