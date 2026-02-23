import { NextRequest, NextResponse } from "next/server"

type NodeType = {
  id: string
  name: string
  description?: string
  prerequisites?: string[]
}

type MCQ = {
  type: "mcq"
  question: string
  options: string[]
  correct_answer: string
}

type ShortQuestion = {
  type: "short"
  question: string
}

type Probe = {
  node_id: string
  questions: (MCQ | ShortQuestion)[]
}

function validateNodes(nodes: any): nodes is NodeType[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return false

  const ids = new Set<string>()

  for (const node of nodes) {
    if (!node.id || !node.name) return false
    if (ids.has(node.id)) return false
    ids.add(node.id)
  }

  return true
}

function validateProbes(probes: any, nodes: NodeType[]): probes is Probe[] {
  if (!Array.isArray(probes)) return false
  if (probes.length !== nodes.length) return false

  const nodeIds = new Set(nodes.map(n => n.id))

  for (const probe of probes) {
    if (!probe.node_id || !nodeIds.has(probe.node_id)) return false
    if (!Array.isArray(probe.questions)) return false

    const mcqs = probe.questions.filter((q: any) => q.type === "mcq")
    const shorts = probe.questions.filter((q: any) => q.type === "short")

    if (mcqs.length !== 2) return false
    if (shorts.length !== 1) return false

    for (const mcq of mcqs) {
      if (
        !mcq.question ||
        !Array.isArray(mcq.options) ||
        mcq.options.length !== 4 ||
        !mcq.correct_answer
      ) {
        return false
      }
    }

    for (const short of shorts) {
      if (!short.question) return false
    }
  }

  return true
}

export async function POST(req: NextRequest) {
  try {
    const { topic, nodes } = await req.json()

    if (!topic || !nodes) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      )
    }

    if (!validateNodes(nodes)) {
      return NextResponse.json(
        { error: "Invalid node structure" },
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
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
You are a structural calibration question generator.

Return ONLY valid JSON.
No markdown.
No backticks.
No explanations.
Only JSON.

Topic: ${topic}

Nodes:
${JSON.stringify(nodes)}

STRICT RULES:
- Generate exactly 2 MCQs and 1 short explanation question per node.
- Each MCQ must have 4 options.
- Provide correct_answer for MCQs.
- Questions must test conceptual understanding, not memorization.
- Do not skip any node.
- Return in required format only.

Format:

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
          "type": "mcq",
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "B"
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
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      return NextResponse.json(
        {
          error: "Gemini API request failed",
          status: geminiResponse.status,
          details: errorText
        },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()

    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini returned empty response" },
        { status: 500 }
      )
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "No valid JSON found in Gemini output" },
        { status: 500 }
      )
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON from Gemini" },
        { status: 500 }
      )
    }

    if (!validateProbes(parsed.probes, nodes)) {
      return NextResponse.json(
        { error: "Probe structure invalid or incomplete" },
        { status: 500 }
      )
    }

    parsed.probes.sort((a: Probe, b: Probe) =>
      a.node_id.localeCompare(b.node_id)
    )

    return NextResponse.json({
      probes: parsed.probes
    })

  } catch (error) {
    console.error("Probe generation fatal error:", error)

    return NextResponse.json(
      {
        error: "Probe generation failed",
        details: String(error)
      },
      { status: 500 }
    )
  }
}