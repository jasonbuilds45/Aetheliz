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

    // 🔐 Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 🔎 Fetch session
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

    const nodeResults = []

    // -----------------------------
    // 1️⃣ MCQ SCORING (LOCAL)
    // -----------------------------

    const explanationPayload = []

    for (const node of probes) {
      let mcqScore = 0
      const mcqs = node.questions.filter((q: any) => q.type === "mcq")
      const shorts = node.questions.filter((q: any) => q.type === "short")

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

    // -----------------------------
    // 2️⃣ BATCH GEMINI EVALUATION
    // -----------------------------

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
You are a structural calibration engine.

Evaluate conceptual coverage for each node.

Data:
${JSON.stringify(explanationPayload)}

For each node return:

[
  {
    "node_id": "n1",
    "score": number between 0 and 1,
    "missing_concepts": ["..."]
  }
]

STRICT:
- No extra text
- Return ONLY JSON array
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
        { error: "Gemini evaluation failed" },
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

    let parsed: GeminiEval[]
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "Malformed Gemini evaluation JSON" },
        { status: 500 }
      )
    }

    // -----------------------------
    // 3️⃣ FINAL SCORING
    // Weight model:
    // MCQ = 0.4
    // Explanation = 0.6
    // -----------------------------

    parsed.forEach((evalNode) => {
      const local = explanationPayload.find(
        (n) => n.node_id === evalNode.node_id
      )

      if (!local) return

      const finalScore =
        local.mcq_ratio * 0.4 +
        (evalNode.score || 0) * 0.6

      let classification = "Stable"
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

    // Update session
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

// Insert longitudinal history
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
      { error: error.message || "Submission failed" },
      { status: 500 }
    )
  }
}