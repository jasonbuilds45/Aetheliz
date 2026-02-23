import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin

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

    // 🔐 Get user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // ---------------------------------
    // 1️⃣ CALL ARCHITECT
    // ---------------------------------

    const architectRes = await fetch(
  `${baseUrl}/api/architect`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || ""
    },
    body: JSON.stringify({
      topic,
      education_stage: "Undergraduate"
    })
  }
)

    if (!architectRes.ok) {
      const errorText = await architectRes.text()
      console.error("Architect failed:", errorText)

      return NextResponse.json(
        { error: "Architect failed" },
        { status: 500 }
      )
    }

    let architectData: any
    try {
      architectData = await architectRes.json()
    } catch (e) {
      console.error("Architect JSON parse error:", e)
      return NextResponse.json(
        { error: "Architect returned invalid JSON" },
        { status: 500 }
      )
    }

    const graph = architectData.graph

    if (!graph || !Array.isArray(graph)) {
      return NextResponse.json(
        { error: "Architect returned invalid graph structure" },
        { status: 500 }
      )
    }

    // ---------------------------------
    // 2️⃣ GENERATE PROBES
    // ---------------------------------

    const probeRes = await fetch(
      `${baseUrl}/api/probe/generate`,
      {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  cookie: req.headers.get("cookie") || ""
},
        body: JSON.stringify({
          topic,
          nodes: graph
        })
      }
    )

    if (!probeRes.ok) {
      const errorText = await probeRes.text()
      console.error("Probe generation failed:", errorText)

      return NextResponse.json(
        { error: "Probe generation failed" },
        { status: 500 }
      )
    }

    let probeData: any
    try {
      probeData = await probeRes.json()
    } catch (e) {
      console.error("Probe JSON parse error:", e)
      return NextResponse.json(
        { error: "Probe returned invalid JSON" },
        { status: 500 }
      )
    }

    const probes = probeData.probes

    if (!probes || !Array.isArray(probes)) {
      return NextResponse.json(
        { error: "Invalid probe structure" },
        { status: 500 }
      )
    }

    // ---------------------------------
    // 3️⃣ CREATE SESSION
    // ---------------------------------

    const sessionId = randomUUID()

    const { error } = await supabase
      .from("probe_sessions")
      .insert({
        id: sessionId,
        user_id: user.id,
        status: "in_progress",
        metadata: {
          topic,
          graph,
          probes
        }
      })

    if (error) {
      console.error("Session insert error:", error)
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: sessionId
    })

  } catch (error) {
    console.error("Create session fatal error:", error)

    return NextResponse.json(
      { error: "Session creation failed" },
      { status: 500 }
    )
  }
}