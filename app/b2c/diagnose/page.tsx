"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DiagnosePage() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleStart = async () => {
    if (!topic.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/probe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      router.push(`/b2c/diagnose/session/${data.session_id}`)
    } catch (err: any) {
      setError(err.message || "Calibration failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-16">

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-wide">
          Diagnostic Calibration
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Aetheliz will map your conceptual structure, generate atomic probes,
          and detect structural instability within the selected topic.
        </p>
      </div>

      {/* Input Section */}
      <div className="border border-neutral-800 bg-neutral-900 p-8 space-y-8">

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-neutral-500">
            Topic / Syllabus Segment
          </label>

          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Partial Derivatives"
            className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Action */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Expected nodes: ≤ 10 atomic concepts
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="px-6 py-3 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-neutral-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Initializing Calibration..." : "Run Diagnostic"}
          </button>
        </div>

        {error && (
          <div className="text-rose-400 text-sm border border-rose-900 bg-rose-950/40 px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {/* System Info Panel */}
      <div className="text-xs text-neutral-600 border-t border-neutral-800 pt-6 leading-relaxed">
        Process:
        <ul className="mt-3 space-y-2">
          <li>1. Concept graph generation</li>
          <li>2. Atomic probe synthesis</li>
          <li>3. Stability scoring</li>
          <li>4. Instability classification</li>
        </ul>
      </div>
    </div>
  )
}