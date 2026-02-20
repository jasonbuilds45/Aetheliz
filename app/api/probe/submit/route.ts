import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const { session_id, answers } = await req.json()

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

  const { data: session } = await supabase
    .from("probe_sessions")
    .select("*")
    .eq("id", session_id)
    .single()

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const probes = session.metadata?.probes || []
  const nodeResults = []

  for (const node of probes) {
    let mcqScore = 0
    let explanationScore = 0
    let missingConcepts: string[] = []

    const mcqCount = node.questions.filter((q: any) => q.type === "mcq").length
    const shortQuestions = node.questions.filter((q: any) => q.type === "short")

    for (let i = 0; i < node.questions.length; i++) {
      const q = node.questions[i]
      const key = `${node.node_id}-${i}`
      const userAnswer = answers[key]

      if (q.type === "mcq") {
        if (userAnswer === q.correct_answer) {
          mcqScore += 1
        }
      }

      if (q.type === "short") {
        // 🔥 AI CONCEPT COVERAGE SCORING
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
You are a calibration engine.

Node:
${JSON.stringify(node)}

Student Answer:
"${userAnswer}"

Evaluate concept coverage against dependencies:
${JSON.stringify(node.dependencies || [])}

Return ONLY JSON:

{
  "score": number between 0 and 1,
  "missing_concepts": ["..."]
}
`
                    }
                  ]
                }
              ]
            })
          }
        )

        const geminiData = await geminiResponse.json()
        const raw =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""

        const cleaned = raw
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()

        try {
          const parsed = JSON.parse(cleaned)
          explanationScore += parsed.score || 0
          missingConcepts = parsed.missing_concepts || []
        } catch {
          explanationScore += 0
        }
      }
    }

    const shortCount = shortQuestions.length
    const totalWeight = mcqCount + shortCount

    const nodeScore =
      totalWeight > 0
        ? (mcqScore + explanationScore) / totalWeight
        : 0

    let classification = "Stable"
    if (nodeScore < 0.4) classification = "Broken"
    else if (nodeScore < 0.8) classification = "Weak"

    nodeResults.push({
      node_id: node.node_id,
      node_name: node.node_name,
      score: nodeScore,
      classification,
      missing_concepts: missingConcepts
    })
  }

  const overall =
    nodeResults.reduce((sum, n) => sum + n.score, 0) /
    (nodeResults.length || 1)

  await supabase
    .from("probe_sessions")
    .update({
      stability_score: overall,
      metadata: {
        ...session.metadata,
        results: nodeResults
      },
      status: "completed"
    })
    .eq("id", session_id)

  return NextResponse.json({ success: true })
}