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

function getDifficultyInstruction(confidence: number) {
  if (confidence <= 2) {
    return `
Difficulty Level: Foundational.

- Focus on core definitions and basic understanding.
- Avoid edge cases.
- Ensure clarity over complexity.
- Questions should check whether the student understands essential meaning.
`
  }

  if (confidence === 3) {
    return `
Difficulty Level: Intermediate.

- Include application-based reasoning.
- Test cause-effect relationships.
- Include moderate conceptual integration.
`
  }

  return `
Difficulty Level: Advanced.

- Include edge cases and misconception traps.
- Require mechanism-level reasoning.
- Test deeper conceptual relationships.
- Avoid surface-level recall questions.
`
}

export async function POST(req: NextRequest) {
  try {
    const { topic, nodes, confidence } = await req.json()

    if (!topic || !nodes || confidence == null) {
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

    const difficultyInstruction = getDifficultyInstruction(confidence)

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
You are an academic assessment question generator.

Return ONLY valid JSON.
No markdown.
No explanations.

Topic: ${topic}

${difficultyInstruction}

Nodes:
${JSON.stringify(nodes)}

STRICT RULES:
- Generate exactly 2 MCQs and 1 short explanation question per node.
- Each MCQ must have 4 options.
- Provide correct_answer.
- Questions must test conceptual understanding.
- Avoid trivial memorization questions.
- Do not skip any node.

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
    return NextResponse.json(
      {
        error: "Probe generation failed",
        details: String(error)
      },
      { status: 500 }
    )
  }
}