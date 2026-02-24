"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ArchitectGraph from "@/components/architect/ArchitectGraph"

type NodeType = {
  id: string
  name: string
  description?: string
  prerequisites?: string[]
}

export default function ArchitectPage() {
  const router = useRouter()

  const [topic, setTopic] = useState("")
  const [educationStage, setEducationStage] = useState("High School")
  const [graph, setGraph] = useState<NodeType[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateGraph = async () => {
    if (!topic.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          education_stage: educationStage
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to generate")

      setGraph(data.graph)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">

      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Concept Structure Architect
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Generate a structured dependency map before testing understanding.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic (e.g. Thermodynamics)"
            className="border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <select
            value={educationStage}
            onChange={(e) => setEducationStage(e.target.value)}
            className="border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option>Middle School</option>
            <option>High School</option>
            <option>Undergraduate</option>
          </select>

          <button
            onClick={generateGraph}
            disabled={loading}
            className="bg-indigo-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Structure"}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
      </div>

      {/* Graph Section */}
      {graph && (
        <div className="space-y-6">
          <ArchitectGraph nodes={graph} />

          <div className="flex justify-end">
            <button
              onClick={() =>
                router.push(`/b2c/diagnose?topic=${encodeURIComponent(topic)}`)
              }
              className="bg-emerald-600 text-white text-sm font-medium rounded-md px-6 py-2 hover:bg-emerald-700 transition"
            >
              Test My Understanding
            </button>
          </div>
        </div>
      )}

    </div>
  )
}