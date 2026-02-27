import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import crypto from "crypto"

type GeminiNode = {
  id: string
  name: string
  description?: string
  inclusion_reasoning?: string
  prerequisites?: string[]
}

/* =========================================================
   STRICT GRAPH VALIDATION (TRUE DAG ONLY)
========================================================= */
function validateAndNormalizeGraph(nodes: any[]): GeminiNode[] | null {
  if (!Array.isArray(nodes) || nodes.length === 0) return null
  if (nodes.length > 12) return null

  const normalized: GeminiNode[] = []
  const idMap = new Map<string, string>()

  nodes.forEach((node: any, index: number) => {
    if (!node?.id || !node?.name) return

    const newId = `n${index + 1}`
    idMap.set(node.id, newId)

    normalized.push({
      id: newId,
      name: String(node.name).trim(),
      description: node.description || "",
      inclusion_reasoning: node.inclusion_reasoning || "",
      prerequisites: []
    })
  })

  nodes.forEach((node: any, index: number) => {
    if (!normalized[index]) return

    const prereqs: string[] = Array.isArray(node?.prerequisites)
      ? node.prerequisites
      : []

    normalized[index].prerequisites = prereqs
      .map((p: string) => idMap.get(p))
      .filter((p): p is string => typeof p === "string" && p !== normalized[index].id)
  })

  const visited = new Set<string>()
  const stack = new Set<string>()

  function hasCycle(id: string): boolean {
    if (stack.has(id)) return true
    if (visited.has(id)) return false

    visited.add(id)
    stack.add(id)

    const node = normalized.find(n => n.id === id)
    if (!node) return false

    for (const dep of node.prerequisites || []) {
      if (hasCycle(dep)) return true
    }

    stack.delete(id)
    return false
  }

  for (const node of normalized) {
    if (hasCycle(node.id)) return null
  }

  return normalized
}

/* =========================================================
   API HANDLER
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const { topic, education_stage } = await req.json()

    if (!topic || !education_stage) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
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
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    /* 🔥 CACHE REMOVED — ALWAYS GENERATE FRESH */

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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
                  text:
                    "You are a curriculum decomposition engine.\n\n" +
                    "Topic: " + topic + "\n" +
                    "Education Level: " + education_stage + "\n\n" +
                    "Return ONLY valid JSON.\n\n" +
                    "CRITICAL:\n" +
                    "- All concepts MUST directly relate to the topic.\n" +
                    "- If the topic is biology, DO NOT include programming.\n" +
                    "- If the topic is physics, DO NOT include unrelated domains.\n" +
                    "- Maximum 8 major conceptual pillars.\n" +
                    "- Strict Directed Acyclic Graph.\n" +
                    "- No cycles.\n\n" +
                    "Format:\n" +
                    "{\n" +
                    '  "nodes": [\n' +
                    "    {\n" +
                    '      "id": "x",\n' +
                    '      "name": "Concept",\n' +
                    '      "description": "Short explanation",\n' +
                    '      "inclusion_reasoning": "Why this concept is required",\n' +
                    '      "prerequisites": []\n' +
                    "    }\n" +
                    "  ]\n" +
                    "}"
                }
              ]
            }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      return NextResponse.json({ error: "Gemini API failed" }, { status: 500 })
    }

    const geminiData = await geminiResponse.json()

    let raw =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    raw = raw.replace(/```/g, "").trim()

    let parsed: any

    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json({ error: "Malformed JSON from AI" }, { status: 500 })
      }
      parsed = JSON.parse(match[0])
    }

    if (!parsed?.nodes) {
      return NextResponse.json({ error: "AI did not return nodes array" }, { status: 500 })
    }

    const normalized = validateAndNormalizeGraph(parsed.nodes)

    if (!normalized) {
      return NextResponse.json({ error: "Invalid graph structure" }, { status: 500 })
    }

    /* Insert new map */
    const { data: map } = await supabase
      .from("architect_maps")
      .insert({
        user_id: user.id,
        topic,
        education_stage,
        hash: crypto.randomUUID() // prevent collisions
      })
      .select()
      .single()

    if (!map) {
      return NextResponse.json({ error: "Failed to create architect map" }, { status: 500 })
    }

    const nodeInsertData = normalized.map((n, index) => ({
      map_id: map.id,
      name: n.name,
      description: n.description,
      inclusion_reasoning: n.inclusion_reasoning,
      level: index
    }))

    const { data: insertedNodes } = await supabase
      .from("architect_nodes")
      .insert(nodeInsertData)
      .select()

    if (!insertedNodes) {
      return NextResponse.json({ error: "Failed to insert nodes" }, { status: 500 })
    }

    const idLookup: Record<string, string> = {}
    normalized.forEach((n, i) => {
      idLookup[n.id] = insertedNodes[i].id
    })

    const edgeInsertData: any[] = []

    normalized.forEach(node => {
      node.prerequisites?.forEach(pre => {
        if (idLookup[pre] && idLookup[node.id]) {
          edgeInsertData.push({
            map_id: map.id,
            prerequisite_id: idLookup[pre],
            dependent_id: idLookup[node.id]
          })
        }
      })
    })

    if (edgeInsertData.length) {
      await supabase.from("architect_edges").insert(edgeInsertData)
    }

    return NextResponse.json({
      source: "generated",
      map_id: map.id,
      nodes: insertedNodes,
      edges: edgeInsertData
    })

  } catch (err) {
    console.error("Architect fatal error:", err)
    return NextResponse.json({ error: "Architect failed" }, { status: 500 })
  }
}