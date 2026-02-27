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
  if (nodes.length > 15) return null

  const normalized: GeminiNode[] = []
  const idMap = new Map<string, string>()

  // Normalize IDs
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

  // Map prerequisites safely
  nodes.forEach((node: any, index: number) => {
    if (!normalized[index]) return

    const prereqs: string[] = Array.isArray(node?.prerequisites)
      ? node.prerequisites
      : []

    normalized[index].prerequisites = prereqs
      .map((p: string) => idMap.get(p))
      .filter((p): p is string => {
        return typeof p === "string" && p !== normalized[index].id
      })
  })

  // Cycle detection
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

  // Topological sort
  const sorted: GeminiNode[] = []
  const seen = new Set<string>()

  function topo(id: string) {
    if (seen.has(id)) return
    seen.add(id)

    const node = normalized.find(n => n.id === id)
    if (!node) return

    for (const dep of node.prerequisites || []) {
      topo(dep)
    }

    sorted.push(node)
  }

  normalized.forEach(n => topo(n.id))

  return sorted
}

/* =========================================================
   API HANDLER
========================================================= */

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

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const hash = crypto
      .createHash("sha256")
      .update(`${topic.toLowerCase()}::${education_stage}`)
      .digest("hex")

    // Check existing
    const { data: existingMap, error: existingError } = await supabase
      .from("architect_maps")
      .select("*")
      .eq("user_id", user.id)
      .eq("hash", hash)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { error: "Failed to check existing maps" },
        { status: 500 }
      )
    }

    if (existingMap) {
      const { data: nodes } = await supabase
        .from("architect_nodes")
        .select("*")
        .eq("map_id", existingMap.id)

      const { data: edges } = await supabase
        .from("architect_edges")
        .select("*")
        .eq("map_id", existingMap.id)

      return NextResponse.json({
        source: "existing",
        map_id: existingMap.id,
        nodes: nodes || [],
        edges: edges || []
      })
    }

    // Gemini call
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
                    "Decompose the topic: " + topic + "\n" +
                    "For education level: " + education_stage + "\n\n" +
                    "Return ONLY valid JSON.\n\n" +
                    "Format:\n" +
                    "{\n" +
                    '  "nodes": [\n' +
                    "    {\n" +
                    '      "id": "x",\n' +
                    '      "name": "Concept",\n' +
                    '      "description": "Short explanation",\n' +
                    '      "inclusion_reasoning": "Why this concept is structurally required",\n' +
                    '      "prerequisites": []\n' +
                    "    }\n" +
                    "  ]\n" +
                    "}\n\n" +
                    "Rules:\n" +
                    "- Maximum 8 nodes\n" +
                    "- Strict Directed Acyclic Graph\n" +
                    "- No cycles\n" +
                    "- No unrelated topics\n" +
                    "- All nodes must directly relate to the given topic\n"
                }
              ]
            }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      return NextResponse.json(
        { error: "Gemini API failed" },
        { status: 500 }
      )
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
        return NextResponse.json(
          { error: "Malformed JSON from AI" },
          { status: 500 }
        )
      }
      parsed = JSON.parse(match[0])
    }

    if (!parsed?.nodes) {
      return NextResponse.json(
        { error: "AI did not return nodes array" },
        { status: 500 }
      )
    }

    const normalized = validateAndNormalizeGraph(parsed.nodes)

    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid graph structure (cycle detected)" },
        { status: 500 }
      )
    }

    const { data: map, error: mapError } = await supabase
      .from("architect_maps")
      .insert({
        user_id: user.id,
        topic,
        education_stage,
        hash
      })
      .select()
      .single()

    if (mapError || !map) {
      return NextResponse.json(
        { error: "Failed to create architect map" },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: "Failed to insert architect nodes" },
        { status: 500 }
      )
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
    return NextResponse.json(
      { error: "Architect failed" },
      { status: 500 }
    )
  }
}