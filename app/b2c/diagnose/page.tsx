"use client"

import { useState } from "react"

type Node = {
  id: string
  name: string
  description: string
  prerequisites: string[]
}

export default function DiagnosePage() {
  const [topic, setTopic] = useState("")
  const [graph, setGraph] = useState<Node[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          education_stage: "Undergraduate" // replace later from settings
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setGraph(data.graph)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-10 space-y-10">

      <h1 className="text-3xl font-bold">Diagnose a Concept</h1>

      <div className="flex gap-4">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g. Partial Derivatives)"
          className="flex-1 border rounded px-4 py-3"
        />
        <button
          onClick={handleGenerate}
          className="bg-primary text-white px-6 py-3 rounded font-semibold"
        >
          Generate Structure
        </button>
      </div>

      {loading && <div>Building concept structure...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {graph.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-6 relative">

            {graph.map(node => (
              <div
                key={node.id}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <h3 className="font-semibold text-lg">{node.name}</h3>
                <p className="text-sm text-slate-600 mt-2">
                  {node.description}
                </p>

                {node.prerequisites.length > 0 && (
                  <div className="mt-3 text-xs text-slate-500">
                    Depends on: {node.prerequisites.join(", ")}
                  </div>
                )}
              </div>
            ))}

          </div>

          <div className="pt-10">
            <button className="bg-black text-white px-6 py-3 rounded font-semibold">
              Start Calibration
            </button>
          </div>
        </>
      )}
    </div>
  )
}