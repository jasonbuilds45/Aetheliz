import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"
import OpenAI from "openai"

type NodeType = {
  id: string
  name: string
  description?: string
  prerequisites?: string[]
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function validateAndNormalizeGraph(nodes: any[]): NodeType[] | null {
  if (!Array.isArray(nodes) || nodes.length === 0) return null
  if (nodes.length > 10) return null

  const normalized: NodeType[] = []
  const idMap = new Map<string, string>()

  nodes.forEach((node, index) => {
    if (!node?.id || !node?.name) return

    const newId = `n${index + 1}`
    idMap.set(node.id, newId)

    normalized.push({
      id: newId,
      name: String(node.name).trim(),
      description: node.description || "",
      prerequisites: []
    })
  })

  nodes.forEach((node, index) => {
    const prereqs = Array.isArray(node?.prerequisites)
      ? node.prerequisites
      : []

    normalized[index].prerequisites = prereqs
      .map((p: string) => idMap.get(p))
      .filter(Boolean) as string[]
  })

  for (const node of normalized) {
    if (node.prerequisites?.includes(node.id)) return null
  }

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

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.OPENAI_API_KEY
    ) {
      return NextResponse.json(
        { error: "Server environment variables missing" },
        { status: 500 }
      )
    }

    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

    const { data: cached } = await supabase
      .from("topic_graphs")
      .select("nodes")
      .eq("hash", hash)
      .maybeSingle()

    if (cached?.nodes) {
      return NextResponse.json({
        source: "cache",
        graph: cached.nodes
      })
    }

    // 🔥 OpenAI call (stable)
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `
You are a curriculum decomposition engine.

Return ONLY valid JSON.
No markdown.
No backticks.
No explanations.
Only JSON.
`
        },
        {
          role: "user",
          content: `
Decompose "${topic}" for level "${education_stage}".

Return format:

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
- Directed acyclic graph
- Maximum 10 nodes
`
        }
      ]
    })

    const rawText = response.output_text

    if (!rawText) {
      return NextResponse.json(
        { error: "OpenAI returned empty response" },
        { status: 500 }
      )
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "No JSON found in OpenAI output" },
        { status: 500 }
      )
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON from OpenAI" },
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
    console.error("Architect fatal error:", error)

    return NextResponse.json(
  {
    error: "Architect generation failed",
    details: String(error)
  },
  { status: 500 }
)
  }
}