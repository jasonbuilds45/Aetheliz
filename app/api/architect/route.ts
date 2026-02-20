import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { topic, education_stage } = await req.json()

    if (!topic || !education_stage) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    const hash = crypto
      .createHash("sha256")
      .update(`${topic.toLowerCase()}::${education_stage}`)
      .digest("hex")

    // Check cache first
    const existing = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/topic_graphs?hash=eq.${hash}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    )

    const existingData = await existing.json()

    if (existingData.length > 0) {
      return NextResponse.json({
        source: "cache",
        graph: existingData[0].nodes,
      })
    }

    // If not cached → Call Gemini
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a curriculum decomposition engine.

Decompose the topic "${topic}" for education level "${education_stage}".

Return ONLY valid JSON in this format:

{
  "nodes": [
    {
      "id": "n1",
      "name": "Concept Name",
      "description": "Short explanation",
      "prerequisites": []
    }
  ]
}

Rules:
- Use atomic conceptual units
- Build a directed acyclic dependency structure
- prerequisites must reference other node ids
- Maximum 10 nodes
- No extra text
`
                }
              ]
            }
          ]
        }),
      }
    )

    const geminiData = await geminiResponse.json()

    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const parsed = JSON.parse(cleaned)

    // Store in cache
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/topic_graphs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        topic,
        education_stage,
        hash,
        nodes: parsed.nodes,
      }),
    })

    return NextResponse.json({
      source: "generated",
      graph: parsed.nodes,
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Architect generation failed" },
      { status: 500 }
    )
  }
}