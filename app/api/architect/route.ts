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

  // Reindex deterministically
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

  // Remap prerequisites
  nodes.forEach((node, index) => {
    const prereqs = Array.isArray(node?.prerequisites)
      ? node.prerequisites
      : []

    normalized[index].prerequisites = prereqs
      .map((p: string) => idMap.get(p))
      .filter(Boolean) as string[]
  })

  // Prevent self dependency
  for (const node of normalized) {
    if (node.prerequisites?.includes(node.id)) {
      return null
    }
  }

  // Detect cycles
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

    // 🔒 Environment validation
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.GEMINI_API_KEY
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

    // ✅ Safe cache lookup (no crash if not found)
    const { data: cached, error: cacheError } = await supabase
      .from("topic_graphs")
      .select("nodes")
      .eq("hash", hash)
      .maybeSingle()

    if (cacheError) {
      console.error("Cache error:", cacheError)
    }

    if (cached?.nodes) {
      return NextResponse.json({
        source: "cache",
        graph: cached.nodes
      })
    }

    // 🔥 Call Gemini
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
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
  const errorText = await geminiResponse.text()

  console.error("Gemini status:", geminiResponse.status)
  console.error("Gemini error body:", errorText)

  return NextResponse.json(
    {
      error: "Gemini API request failed",
      status: geminiResponse.status,
      details: errorText
    },
    { status: 500 }
  )
}

    let geminiData: any
    try {
      geminiData = await geminiResponse.json()
    } catch (e) {
      console.error("Gemini JSON parse error:", e)
      return NextResponse.json(
        { error: "Invalid Gemini response format" },
        { status: 500 }
      )
    }

    const raw =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (!raw) {
      return NextResponse.json(
        { error: "Gemini returned empty response" },
        { status: 500 }
      )
    }

    // Extract JSON block safely
    const jsonMatch = raw.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error("No JSON found in Gemini output:", raw)
      return NextResponse.json(
        { error: "No valid JSON object found in Gemini output" },
        { status: 500 }
      )
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error("Malformed JSON from Gemini:", e)
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

    // 💾 Cache validated graph (safe insert)
    const { error: insertError } = await supabase
      .from("topic_graphs")
      .insert({
        topic,
        education_stage,
        hash,
        nodes: normalized
      })

    if (insertError) {
      console.error("Cache insert error:", insertError)
    }

    return NextResponse.json({
      source: "generated",
      graph: normalized
    })

  } catch (error) {
    console.error("Architect fatal error:", error)

    return NextResponse.json(
      { error: "Architect generation failed" },
      { status: 500 }
    )
  }
}