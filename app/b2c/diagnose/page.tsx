"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DiagnosePage() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const handleStart = async () => {
    if (!topic) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/probe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      router.push(`/b2c/diagnose/session/${data.session_id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-8">

      <h1 className="text-3xl font-bold">Diagnose a Concept</h1>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter a topic (e.g. Partial Derivatives)"
        className="w-full border rounded px-4 py-3"
      />

      <button
        onClick={handleStart}
        disabled={loading}
        className="bg-primary text-white px-6 py-3 rounded font-semibold"
      >
        {loading ? "Preparing Calibration..." : "Start Calibration"}
      </button>

      {error && <div className="text-red-600">{error}</div>}
    </div>
  )
}