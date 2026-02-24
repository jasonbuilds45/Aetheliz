import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

type GeminiEval = {
  node_id: string
  score: number
  missing_concepts: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { session_id, answers } = await req.json()

    if (!session_id || !answers) {
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
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: session, error: sessionError } = await supabase
      .from("probe_sessions")
      .select("*")
      .eq("id", session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "Session already completed" },
        { status: 400 }
      )
    }

    const probes = session.metadata?.probes || []
    if (!Array.isArray(probes) || probes.length === 0) {
      return NextResponse.json(
        { error: "Invalid session structure" },
        { status: 500 }
      )
    }

    const explanationPayload: {
      node_id: string
      node_name: string
      prerequisites: string[]
      student_answer: string
      mcq_ratio: number
    }[] = []

    for (const node of probes) {
      let mcqScore = 0
      const mcqs = node.questions.filter((q: any) => q.type === "mcq")

      mcqs.forEach((q: any, index: number) => {
        const key = `${node.node_id}-${index}`
        const userAnswer = answers[key]
        if (userAnswer === q.correct_answer) {
          mcqScore += 1
        }
      })

      const mcqRatio = mcqs.length > 0 ? mcqScore / mcqs.length : 0

      explanationPayload.push({
        node_id: node.node_id,
        node_name: node.node_name,
        prerequisites: node.prerequisites || [],
        student_answer:
          answers[`${node.node_id}-${mcqs.length}`] || "",
        mcq_ratio: mcqRatio
      })
    }

    // 🔥 Gemini evaluation (stable model)
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
You are an academic concept evaluator.

Return ONLY valid JSON array.
No markdown.
No explanations.

Evaluate the student's conceptual understanding for each topic component.

Use:
- MCQ ratio (objective correctness)
- Written explanation (depth, clarity, correctness)

Data:
${JSON.stringify(explanationPayload)}

Return:

[
  {
    "node_id": "n1",
    "score": number between 0 and 1,
    "missing_concepts": ["..."]
  }
]

Scoring guidance:
- 0.8 - 1.0 = strong conceptual understanding
- 0.4 - 0.79 = partial understanding
- 0 - 0.39 = weak understanding
`

Return ONLY valid JSON array.
No markdown.
No explanations.

Evaluate conceptual coverage for each node.

Data:
${JSON.stringify(explanationPayload)}

Return:

[
  {
    "node_id": "n1",
    "score": number between 0 and 1,
    "missing_concepts": ["..."]
  }
]
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
          error: "Gemini evaluation failed",
          status: geminiResponse.status,
          details: errorText
        },
        { status: 500 }
      )
    }

    const geminiData = await geminiResponse.json()

    const raw =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (!raw) {
      return NextResponse.json(
        { error: "Gemini returned empty evaluation" },
        { status: 500 }
      )
    }

    const jsonMatch = raw.match(/\[[\s\S]*\]/)

    if (!jsonMatch) {
      return NextResponse.json(
        { error: "No valid JSON array found in Gemini output" },
        { status: 500 }
      )
    }

    let parsed: GeminiEval[]
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { error: "Malformed Gemini evaluation JSON" },
        { status: 500 }
      )
    }

    const nodeResults: {
      node_id: string
      node_name: string
      score: number
      classification: "Stable" | "Weak" | "Broken"
      missing_concepts: string[]
    }[] = []

    parsed.forEach((evalNode) => {
      const local = explanationPayload.find(
        (n) => n.node_id === evalNode.node_id
      )

      if (!local) return

      const finalScore =
        local.mcq_ratio * 0.4 +
        (evalNode.score || 0) * 0.6

      let classification: "Stable" | "Weak" | "Broken" = "Stable"

      if (finalScore < 0.4) classification = "Broken"
      else if (finalScore < 0.8) classification = "Weak"

      nodeResults.push({
        node_id: evalNode.node_id,
        node_name: local.node_name,
        score: finalScore,
        classification,
        missing_concepts: evalNode.missing_concepts || []
      })
    })

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

    for (const node of nodeResults) {
      await supabase
        .from("concept_stability_history")
        .insert({
          user_id: user.id,
          topic: session.metadata?.topic || "",
          node_id: node.node_id,
          node_name: node.node_name,
          stability_score: node.score
        })
    }

    return NextResponse.json({
      success: true,
      overall_stability: overall
    })

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Submission failed",
        details: String(error)
      },
      { status: 500 }
    )
  }
}