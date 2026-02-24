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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY missing" },
        { status: 500 }
      )
    }

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
You are an academic tutor providing targeted clarification.

Topic: ${topic}
Subtopic: ${node_name}
Missing Concepts: ${JSON.stringify(missing_concepts)}

Generate:

{
  "explanation": "Clear and simple explanation (max 250 words)",
  "example": "One short worked example",
  "check_question": "One short conceptual verification question"
}

Rules:
- Address ONLY the missing concepts
- Do NOT reteach the full topic
- Keep language simple and clear
- Return ONLY valid JSON
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
      return NextResponse.json(
        { error: "Gemini repair failed", details: errorText },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()

    const raw =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ""

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

  } catch (error) {
    return NextResponse.json(
      { error: "Repair failed", details: String(error) },
      { status: 500 }
    )
  }
}