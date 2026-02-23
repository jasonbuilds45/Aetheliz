import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

type NodeType = {
  id: string
  name: string
  description?: string
  prerequisites?: string[]
}

function validateAndNormalizeGraph(nodes: any[]): NodeType[] | null {
  if (!Array.isArray(nodes) || nodes.length === 0) return null
  if (nodes.length > 10) return null

  const normalized: NodeType[] = []
  const idMap = new Map<string, string>()

  // Step 1 — Reindex deterministically
  nodes.forEach((node, index) => {
    const newId = `n${index + 1}`
    idMap.set(node.id, newId)

    normalized.push({
      id: newId,
      name: node.name?.trim(),
      description: node.description || "",
      prerequisites: []
    })
  })

  // Step 2 — Remap prerequisites
  nodes.forEach((node, index) => {
    const newId = `n${index + 1}`
    const prereqs = node.prerequisites || []

    normalized[index].prerequisites = prereqs
      .map((p: string) => idMap.get(p))
      .filter(Boolean) as string[]
  })

  // Step 3 — Validate no self dependency
  for (const node of normalized) {
    if (node.prerequisites?.includes(node.id)) {
      return null
    }
  }

  // Step 4 — Detect circular dependencies
  const visited = new Set<string>()
  const stack = new Set<string>()

  function dfs(nodeId: string): boolean {
    if (stack.has(nodeId)) return true
    if (visited.has(nodeId)) return false

    visited.add(nodeId)
    stack.add(nodeId)

    const node = normalized.find(n => n.id === nodeId)
    if (!node) return false

    for (const dep of node.prerequisites || []) {
      if (dfs(dep)) return true
    }

    stack.delete(nodeId)
    return false
  }

  for (const node of normalized) {
    if (dfs(node.id)) return null
  }

  return normalized
}

export async function POST(req: NextRequest) {
  try {
    const { topic, education_stage } = await req.json()

    if (!topic || !education_stage) {
      return NextResponse.json(
        { error: "Missing parameters" },
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

    const hash = crypto
      .createHash("sha256")
      .update(`${topic.toLowerCase()}::${education_stage}`)
      .digest("hex")

    // 🔎 Check cache
    const { data: cached } = await supabase
      .from("topic_graphs")
      .select("*")
      .eq("hash", hash)
      .single()

    if (cached) {
      return NextResponse.json({
        source: "cache",
        graph: cached.nodes
      })
    }

    // 🔥 Call Gemini
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a curriculum decomposition engine.

Decompose "${topic}" for level "${education_stage}".

Return ONLY JSON:

{
  "nodes": [
    {
      "id": "x",
      "name": "Concept",
      "description": "Short explanation",
      "prerequisites": []
    }
  ]
}

Rules:
- Atomic conceptual units
- Directed acyclic structure
- Max 10 nodes
- No extra text
`
                }
              ]
            }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      return NextResponse.json(
        { error: "Gemini failed" },
        { status: 500 }
      )
    }

    let geminiData
    try {
      geminiData = await geminiResponse.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid Gemini response" },
        { status: 500 }
      )
    }

    const raw =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
      console.log("Gemini RAW output:", raw)

    const jsonMatch = raw.match(/\{[\s\S]*\}/)

if (!jsonMatch) {
  return NextResponse.json(
    { error: "No valid JSON object found in Gemini output" },
    { status: 500 }
  )
}

let parsed
try {
  parsed = JSON.parse(jsonMatch[0])
} catch {
  return NextResponse.json(
    { error: "Malformed DAG JSON" },
    { status: 500 }
  )
}

    const normalized = validateAndNormalizeGraph(parsed.nodes)

    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid or cyclic graph generated" },
        { status: 500 }
      )
    }

    // 💾 Cache validated graph
    await supabase.from("topic_graphs").insert({
      topic,
      education_stage,
      hash,
      nodes: normalized
    })

    return NextResponse.json({
      source: "generated",
      graph: normalized
    })

  } catch (error) {
    console.error("Architect error:", error)

return NextResponse.json(
  { error: String(error) },
  { status: 500 }
)
  }
}