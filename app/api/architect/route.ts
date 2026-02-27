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

function validateAndNormalizeGraph(nodes: any[]): GeminiNode[] | null {
  if (!Array.isArray(nodes) || nodes.length === 0) return null
  if (nodes.length > 15) return null

  const normalized: GeminiNode[] = []
  const idMap = new Map<string, string>()

  nodes.forEach((node, index) => {
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

  nodes.forEach((node, index) => {
    const prereqs = Array.isArray(node?.prerequisites)
      ? node.prerequisites
      : []

    if (!normalized[index]) return

    normalized[index].prerequisites = prereqs
      .map((p: string) => idMap.get(p))
      .filter(Boolean) as string[]
  })

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

    // 🔐 Require authenticated user
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

    // 🔎 Check if map already exists
    const { data: existingMap, error: existingError } = await supabase
      .from("architect_maps")
      .select("*")
      .eq("user_id", user.id)
      .eq("hash", hash)
      .maybeSingle()

    if (existingError) {
  console.error("Existing map check error:", existingError)

  return NextResponse.json(
    { 
      error: "Failed to check existing maps",
      details: existingError.message,
      code: existingError.code
    },
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

    // 🔥 Gemini call
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
                  text: `
You are a curriculum decomposition engine.

Return ONLY valid JSON.

Format:
{
  "nodes": [
    {
      "id": "x",
      "name": "Concept",
      "description": "Short explanation",
      "inclusion_reasoning": "Why this concept is structurally required",
      "prerequisites": []
    }
  ]
}

Rules:
- Atomic conceptual units
- Directed acyclic graph
- Maximum 15 nodes
- Logical structural dependency
- Educationally coherent
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
        { error: "Gemini API failed" },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()

let raw =
  geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ""

if (!raw) {
  return NextResponse.json(
    { error: "Empty response from AI" },
    { status: 500 }
  )
}

// Remove markdown code blocks if present
raw = raw.replace(/```json/gi, "")
raw = raw.replace(/```/g, "")
raw = raw.trim()

// Attempt safe JSON extraction
let parsed: any

try {
  parsed = JSON.parse(raw)
} catch {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON block found")
    parsed = JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error("AI raw output:", raw)
    return NextResponse.json(
      { error: "Malformed JSON from AI", details: "AI returned invalid structure" },
      { status: 500 }
    )
  }
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
        { error: "Invalid graph structure" },
        { status: 500 }
      )
    }

    // 🧱 Create map
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
  console.error("Map insert error:", mapError)

  return NextResponse.json(
    {
      error: "Failed to create architect map",
      details: mapError?.message,
      code: mapError?.code
    },
    { status: 500 }
  )
}

    // 🧱 Insert nodes
    const nodeInsertData = normalized.map((n, index) => ({
      map_id: map.id,
      name: n.name,
      description: n.description,
      inclusion_reasoning: n.inclusion_reasoning,
      level: index
    }))

    const { data: insertedNodes, error: insertError } = await supabase
      .from("architect_nodes")
      .insert(nodeInsertData)
      .select()

    if (
      insertError ||
      !insertedNodes ||
      insertedNodes.length !== normalized.length
    ) {
      return NextResponse.json(
        { error: "Failed to insert architect nodes" },
        { status: 500 }
      )
    }

    const idLookup: Record<string, string> = {}

    normalized.forEach((n, i) => {
      idLookup[n.id] = insertedNodes[i].id
    })

    // 🧱 Insert edges
    const edgeInsertData: any[] = []

    normalized.forEach((node) => {
      node.prerequisites?.forEach((pre) => {
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
      const { error: edgeError } = await supabase
        .from("architect_edges")
        .insert(edgeInsertData)

      if (edgeError) {
        return NextResponse.json(
          { error: "Failed to insert edges" },
          { status: 500 }
        )
      }
    }

    // 🧠 Initialize stability
    const stabilityInit = insertedNodes.map((node) => ({
      user_id: user.id,
      node_id: node.id,
      stability_state: "fragile",
      confidence_score: 0
    }))

    const { error: stabilityError } = await supabase
      .from("architect_stability")
      .insert(stabilityInit)

    if (stabilityError) {
      return NextResponse.json(
        { error: "Failed to initialize stability" },
        { status: 500 }
      )
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