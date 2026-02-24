import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
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

    // 1️⃣ Authenticate
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2️⃣ Get teacher profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!profile.tenant_id) {
      return NextResponse.json({
        overview: {
          class_name: "Your Class",
          average_stability: 0,
          total_students: 0,
          active_sessions: 0
        },
        weak_concepts: [],
        at_risk_students: []
      })
    }

    // 3️⃣ Fetch students
    const { data: studentsData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("tenant_id", profile.tenant_id)
      .eq("role", "student")

    const students = studentsData || []
    const studentIds = students.map(s => s.id)

    if (studentIds.length === 0) {
      return NextResponse.json({
        overview: {
          class_name: "Your Class",
          average_stability: 0,
          total_students: 0,
          active_sessions: 0
        },
        weak_concepts: [],
        at_risk_students: []
      })
    }

    // 4️⃣ Fetch completed probe sessions
    const { data: sessionsData } = await supabase
      .from("probe_sessions")
      .select("user_id, stability_score, metadata")
      .in("user_id", studentIds)
      .eq("status", "completed")

    const sessions = sessionsData || []

    // 5️⃣ Compute class average
    const avg =
      sessions.reduce((sum, s) => sum + (s.stability_score || 0), 0) /
      (sessions.length || 1)

    // 6️⃣ Aggregate weak concepts
    const conceptMap: Record<string, { total: number; count: number }> = {}

    sessions.forEach(session => {
      const results = session.metadata?.results || []

      results.forEach((node: any) => {
        if (!conceptMap[node.node_name]) {
          conceptMap[node.node_name] = { total: 0, count: 0 }
        }

        conceptMap[node.node_name].total += node.score || 0
        conceptMap[node.node_name].count += 1
      })
    })

    const weakConcepts = Object.entries(conceptMap)
      .map(([node_name, data]) => ({
        node_name,
        average_score: data.total / data.count
      }))
      .sort((a, b) => a.average_score - b.average_score)
      .slice(0, 5)

    // 7️⃣ At-risk students
    const studentScoreMap: Record<string, number> = {}

    sessions.forEach(session => {
      studentScoreMap[session.user_id] = session.stability_score || 0
    })

    const atRisk = students
      .map(s => ({
        student_name: s.full_name || "Student",
        stability_score: studentScoreMap[s.id] || 0
      }))
      .sort((a, b) => a.stability_score - b.stability_score)
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        class_name: "Your Class",
        average_stability: avg,
        total_students: students.length,
        active_sessions: 0
      },
      weak_concepts: weakConcepts,
      at_risk_students: atRisk
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Teacher overview failed" },
      { status: 500 }
    )
  }
}