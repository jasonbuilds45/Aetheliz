import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const nodeId = req.nextUrl.searchParams.get("node_id")

    if (!nodeId) {
      return NextResponse.json(
        { error: "Missing node_id" },
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

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from("concept_stability_history")
      .select("*")
      .eq("user_id", user.id)
      .eq("node_id", nodeId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: "History retrieval failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ history: data })

  } catch {
    return NextResponse.json(
      { error: "History error" },
      { status: 500 }
    )
  }
}