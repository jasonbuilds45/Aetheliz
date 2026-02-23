import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

/* ------------------------------
   DAG VALIDATION
--------------------------------*/

function validateGraph(graph: any) {
  if (!Array.isArray(graph) || graph.length === 0) return false

  const ids = new Set<string>()

  for (const node of graph) {
    if (!node.id || !node.name) return false
    if (ids.has(node.id)) return false
    ids.add(node.id)
  }

  for (const node of graph) {
    if (node.prerequisites) {
      if (!Array.isArray(node.prerequisites)) return false
      for (const dep of node.prerequisites) {
        if (!ids.has(dep)) return false
      }
    }
  }

  return true
}

/* ------------------------------
   PROBE VALIDATION
--------------------------------*/

function validateProbes(probes: any, graph: any[]) {
  if (!Array.isArray(probes)) return false
  if (probes.length !== graph.length) return false

  const nodeIds = new Set(graph.map((n) => n.id))

  for (const probe of probes) {
    if (!probe.node_id || !nodeIds.has(probe.node_id)) return false
    if (!Array.isArray(probe.mcqs) || probe.mcqs.length === 0) return false
    if (!probe.explanation_question) return false
  }

  return true
}

/* ------------------------------
   ROUTE HANDLER
--------------------------------*/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const topic = body?.topic

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

    // 2️⃣ Derive origin dynamically
    const origin = req.nextUrl.origin

    /* -----------------------------------
       ARCHITECT CALL
    ------------------------------------*/

    const architectRes = await fetch(`${origin}/api/architect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        education_stage: "Undergraduate"
      })
    })

    let architectData: any

    try {
      architectData = await architectRes.json()
    } catch {
      throw new Error("Architect returned invalid JSON")
    }

    if (!architectRes.ok) {
      throw new Error(architectData?.error || "Architect failed")
    }

    const graph = architectData?.graph

    if (!validateGraph(graph)) {
      throw new Error("Invalid DAG structure from Architect")
    }

    /* -----------------------------------
       PROBE GENERATION
    ------------------------------------*/

    const probeRes = await fetch(`${origin}/api/probe/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        nodes: graph
      })
    })

    let probeData: any

    try {
      probeData = await probeRes.json()
    } catch {
      throw new Error("Probe generator returned invalid JSON")
    }

    if (!probeRes.ok) {
      throw new Error(probeData?.error || "Probe generation failed")
    }

    const probes = probeData?.probes

    if (!validateProbes(probes, graph)) {
      throw new Error("Invalid probe structure")
    }

    /* -----------------------------------
       NORMALIZE STRUCTURE
    ------------------------------------*/

    const normalizedGraph = graph.map((node: any) => ({
      id: node.id,
      name: node.name,
      description: node.description || "",
      prerequisites: node.prerequisites || []
    }))

    const normalizedProbes = probes.map((probe: any) => ({
      node_id: probe.node_id,
      mcqs: probe.mcqs,
      explanation_question: probe.explanation_question
    }))

    /* -----------------------------------
       CREATE SESSION
    ------------------------------------*/

    const sessionId = randomUUID()

    const { error } = await supabase
      .from("probe_sessions")
      .insert({
        id: sessionId,
        user_id: user.id,
        status: "in_progress",
        metadata: {
          topic,
          graph: normalizedGraph,
          probes: normalizedProbes
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