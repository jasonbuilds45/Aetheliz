import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { topic, confidence } = await req.json()

    if (!topic || confidence == null) {
      return NextResponse.json(
        { error: "Topic and confidence are required" },
        { status: 400 }
      )
    }

    if (confidence < 1 || confidence > 5) {
      return NextResponse.json(
        { error: "Invalid confidence level" },
        { status: 400 }
      )
    }

    const baseUrl = req.nextUrl.origin
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

    // 1️⃣ CALL ARCHITECT

    const architectRes = await fetch(`${baseUrl}/api/architect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || ""
      },
      body: JSON.stringify({
        topic,
        education_stage: "Undergraduate"
      })
    })

    if (!architectRes.ok) {
      const errorText = await architectRes.text()
      return NextResponse.json({ error: errorText }, { status: 500 })
    }

    const architectData = await architectRes.json()
    const graph = architectData.graph

    if (!graph || !Array.isArray(graph)) {
      return NextResponse.json(
        { error: "Invalid graph structure" },
        { status: 500 }
      )
    }

    // 2️⃣ GENERATE PROBES (confidence-aware)

    const probeRes = await fetch(`${baseUrl}/api/probe/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || ""
      },
      body: JSON.stringify({
        topic,
        confidence,
        nodes: graph
      })
    })

    if (!probeRes.ok) {
      return NextResponse.json(
        { error: "Probe generation failed" },
        { status: 500 }
      )
    }

    const probeData = await probeRes.json()
    const rawProbes = probeData.probes

    if (!rawProbes || !Array.isArray(rawProbes)) {
      return NextResponse.json(
        { error: "Invalid probe structure" },
        { status: 500 }
      )
    }

    const probes = rawProbes.map((probe: any) => {
      const node = graph.find((n: any) => n.id === probe.node_id)

      return {
        node_id: probe.node_id,
        node_name: node?.name || "",
        prerequisites: node?.prerequisites || [],
        questions: probe.questions
      }
    })

    // 3️⃣ CREATE SESSION

    const sessionId = randomUUID()

    const { error } = await supabase
      .from("probe_sessions")
      .insert({
        id: sessionId,
        user_id: user.id,
        status: "in_progress",
        metadata: {
          topic,
          confidence,
          graph,
          probes
        }
      })

    if (error) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: sessionId
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Session creation failed" },
      { status: 500 }
    )
  }
}