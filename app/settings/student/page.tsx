"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/services/supabaseBrowser"

const supabase = createClient()

type Subject = {
  id: string
  name: string
}

export default function StudentSettingsPage() {
  const [educationStage, setEducationStage] = useState("")
  const [goalType, setGoalType] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load student settings
      const { data: settings } = await supabase
        .from("student_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (settings) {
        setEducationStage(settings.education_stage)
        setGoalType(settings.goal_type)
      }

      // Load subjects
      const { data: subjectList } = await supabase
        .from("subjects")
        .select("id, name")
        .limit(20)

      if (subjectList) setSubjects(subjectList)

      // Load selected subjects
      const { data: preferences } = await supabase
        .from("student_subject_preferences")
        .select("subject_id, baseline_confidence")
        .eq("user_id", user.id)

      if (preferences) {
        const map: Record<string, number> = {}
        preferences.forEach(p => {
          map[p.subject_id] = p.baseline_confidence
        })
        setSelected(map)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const toggleSubject = (id: string) => {
    if (selected[id]) {
      const copy = { ...selected }
      delete copy[id]
      setSelected(copy)
    } else {
      setSelected({ ...selected, [id]: 3 })
    }
  }

  const setConfidence = (id: string, value: number) => {
    setSelected({ ...selected, [id]: value })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expired")

      // Upsert main settings
      const { error: settingsError } = await supabase
        .from("student_settings")
        .upsert({
          user_id: user.id,
          education_stage: educationStage,
          goal_type: goalType,
        }, { onConflict: "user_id" })

      if (settingsError) throw settingsError

      // Delete old preferences
      await supabase
        .from("student_subject_preferences")
        .delete()
        .eq("user_id", user.id)

      // Insert updated preferences
      const inserts = Object.entries(selected).map(([subjectId, confidence]) => ({
        user_id: user.id,
        subject_id: subjectId,
        baseline_confidence: confidence,
      }))

      if (inserts.length > 0) {
        const { error: prefError } = await supabase
          .from("student_subject_preferences")
          .insert(inserts)

        if (prefError) throw prefError
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-10">Loading settings...</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">

      <h1 className="text-2xl font-bold">Student Settings</h1>

      {/* Education Stage */}
      <div>
        <label className="block font-semibold mb-2">Education Stage</label>
        <select
          value={educationStage}
          onChange={(e) => setEducationStage(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option>Secondary School</option>
          <option>Higher Secondary</option>
          <option>Undergraduate</option>
          <option>Postgraduate</option>
          <option>Self-Learner</option>
        </select>
      </div>

      {/* Goal */}
      <div>
        <label className="block font-semibold mb-2">Primary Goal</label>
        <select
          value={goalType}
          onChange={(e) => setGoalType(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option>Strengthen fundamentals</option>
          <option>Prepare for exams</option>
          <option>Identify weak areas</option>
          <option>Advanced mastery</option>
        </select>
      </div>

      {/* Subjects */}
      <div>
        <label className="block font-semibold mb-3">Subjects & Confidence</label>

        <div className="space-y-4">
          {subjects.map(subject => (
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
                    {[1,2,3,4,5].map(star => (
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

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">Settings updated successfully.</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-white px-6 py-3 rounded font-bold"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

    </div>
  )
}