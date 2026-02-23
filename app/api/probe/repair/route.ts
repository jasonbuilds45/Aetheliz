import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { topic, node_name, missing_concepts } = await req.json()

    if (!topic || !node_name || !missing_concepts) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      )
    }

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
You are a structural repair engine.

Topic: ${topic}
Node: ${node_name}
Missing Concepts: ${JSON.stringify(missing_concepts)}

Generate:

{
  "explanation": "Focused structural explanation (max 250 words)",
  "example": "One worked example",
  "check_question": "One conceptual verification question"
}

STRICT:
- Do NOT re-teach full topic
- Only address missing concepts
- Return ONLY JSON
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
        { error: "Gemini repair failed" },
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

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Malformed repair JSON" },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)

  } catch {
    return NextResponse.json(
      { error: "Repair failed" },
      { status: 500 }
    )
  }
}