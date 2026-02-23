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

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent",
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
You are a structural calibration question generator.

Topic: ${topic}

Nodes:
${JSON.stringify(nodes)}

STRICT RULES:
- Generate exactly 2 MCQs and 1 short explanation question per node.
- Each MCQ must have 4 options.
- Provide correct_answer for MCQs.
- Questions must test conceptual understanding, not memorization.
- No extra text.
- Return ONLY valid JSON.

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
        }),
      }
    )

    if (!geminiResponse.ok) {
      return NextResponse.json(
        { error: "Gemini request failed" },
        { status: 500 }
      )
    }

    let geminiData
    try {
      geminiData = await geminiResponse.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid response from Gemini" },
        { status: 500 }
      )
    }

    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Gemini returned malformed JSON" },
        { status: 500 }
      )
    }

    if (!validateProbes(parsed.probes, nodes)) {
      return NextResponse.json(
        { error: "Probe structure invalid or incomplete" },
        { status: 500 }
      )
    }

    // Deterministic normalization: ensure consistent ordering
    parsed.probes.sort((a: Probe, b: Probe) =>
      a.node_id.localeCompare(b.node_id)
    )

    return NextResponse.json({
      probes: parsed.probes
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Probe generation failed" },
      { status: 500 }
    )
  }
}