import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { topic, nodes } = await req.json()

    if (!topic || !nodes) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

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
You are a calibration question generator.

Topic: ${topic}

Nodes:
${JSON.stringify(nodes)}

For each node, generate:
- 2 MCQs (4 options each)
- 1 short explanation question

Return ONLY JSON in this format:

{
  "probes": [
    {
      "node_id": "n1",
      "questions": [
        {
          "type": "mcq",
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A"
        },
        {
          "type": "short",
          "question": "Explain ..."
        }
      ]
    }
  ]
}
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

    return NextResponse.json(parsed)

  } catch (error) {
    return NextResponse.json(
      { error: "Probe generation failed" },
      { status: 500 }
    )
  }
}