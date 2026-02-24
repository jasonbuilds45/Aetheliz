"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DiagnosePage() {
  const [topic, setTopic] = useState("")
  const [confidence, setConfidence] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleStart = async () => {
    if (!topic.trim() || confidence === null) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/probe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, confidence }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      router.push(`/b2c/diagnose/session/${data.session_id}`)
    } catch (err: any) {
      setError(err.message || "Assessment failed to start.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-14">

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">
          Check Your Understanding
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Enter a topic and answer a short set of mixed questions.
          Aetheliz will identify which concepts you understand well
          and which areas need clarification.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8 shadow-sm">

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Topic or Syllabus Segment
          </label>

          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis"
            className="w-full border border-slate-300 px-4 py-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Confidence */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            How confident are you in this topic?
          </p>

          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setConfidence(level)}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition
                  ${
                    confidence === level
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400"
                  }
                `}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            1 = Not confident &nbsp; | &nbsp; 5 = Very confident
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <button
            onClick={handleStart}
            disabled={loading || confidence === null}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Preparing Assessment..." : "Start Assessment"}
          </button>
        </div>

        {error && (
          <div className="text-sm text-rose-600 border border-rose-200 bg-rose-50 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

    </div>
  )
}