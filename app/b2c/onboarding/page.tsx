"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

type Subject = {
  id: string
  name: string
}

export default function StudentOnboarding() {
  const router = useRouter()

  const [educationStage, setEducationStage] = useState("")
  const [goalType, setGoalType] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name")
        .limit(12)

      if (data) setSubjects(data)
    }

    fetchSubjects()
  }, [])

  const toggleSubject = (subjectId: string) => {
    if (selected[subjectId]) {
      const copy = { ...selected }
      delete copy[subjectId]
      setSelected(copy)
    } else {
      setSelected({ ...selected, [subjectId]: 3 })
    }
  }

  const setConfidence = (subjectId: string, value: number) => {
    setSelected({ ...selected, [subjectId]: value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired")

      // Insert main student settings
      const { error: settingsError } = await supabase
        .from("student_settings")
        .insert({
          user_id: user.id,
          education_stage: educationStage,
          goal_type: goalType,
        })

      if (settingsError) throw settingsError

      // Insert subject preferences
      const inserts = Object.entries(selected).map(([subjectId, confidence]) => ({
        user_id: user.id,
        subject_id: subjectId,
        baseline_confidence: confidence,
      }))

      if (inserts.length > 0) {
        const { error: subjectError } = await supabase
          .from("student_subject_preferences")
          .insert(inserts)

        if (subjectError) throw subjectError
      }

      router.replace("/b2c")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-2xl space-y-8 bg-white p-8 rounded-xl shadow">

        <h1 className="text-2xl font-bold">Personalise Your Learning</h1>

        {/* Education Stage */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Education Stage
          </label>
          <select
            value={educationStage}
            onChange={(e) => setEducationStage(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select</option>
            <option>Secondary School</option>
            <option>Higher Secondary</option>
            <option>Undergraduate</option>
            <option>Postgraduate</option>
            <option>Self-Learner</option>
          </select>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Primary Goal
          </label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Select</option>
            <option>Strengthen fundamentals</option>
            <option>Prepare for exams</option>
            <option>Identify weak areas</option>
            <option>Advanced mastery</option>
          </select>
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-sm font-semibold mb-3">
            Choose Your Subjects
          </label>

          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className="font-medium"
                  >
                    {subject.name}
                  </button>

                  {selected[subject.id] && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setConfidence(subject.id, star)}
                          className={`text-lg ${
                            selected[subject.id] >= star
                              ? "text-yellow-500"
                              : "text-slate-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!educationStage || !goalType || Object.keys(selected).length === 0 || loading}
          className="w-full bg-primary text-white py-3 rounded font-bold disabled:opacity-50"
        >
          {loading ? "Saving..." : "Start My Diagnostics"}
        </button>

      </div>
    </div>
  )
}