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

    // 1️⃣ Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔥 IMPORTANT FIX — derive origin dynamically
    const origin = req.nextUrl.origin

    // 2️⃣ Call Architect to build DAG
    const architectRes = await fetch(
      `${origin}/api/architect`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          education_stage: "Undergraduate"
        })
      }
    )

    const architectData = await architectRes.json()

    if (!architectRes.ok) {
      throw new Error(architectData.error || "Architect failed")
    }

    const graph = architectData.graph

    // 3️⃣ Generate Hybrid Probes
    const probeRes = await fetch(
      `${origin}/api/probe/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          nodes: graph
        })
      }
    )

    const probeData = await probeRes.json()

    if (!probeRes.ok) {
      throw new Error(probeData.error || "Probe generation failed")
    }

    const probes = probeData.probes

    // 4️⃣ Create Session
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
      throw new Error(error.message)
    }

    return NextResponse.json({
      session_id: sessionId
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Session creation failed" },
      { status: 500 }
    )
  }
}