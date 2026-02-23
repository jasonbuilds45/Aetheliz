"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type NodeResult = {
  node_id: string
  node_name: string
  score: number
  classification: "Stable" | "Weak" | "Broken"
  missing_concepts: string[]
}

export default function ReportPage() {
  const { id } = useParams()
  const router = useRouter()

  const [topic, setTopic] = useState("")
  const [results, setResults] = useState<NodeResult[]>([])
  const [overall, setOverall] = useState(0)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<Record<string, number[]>>({})

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    const res = await fetch(`/api/probe/session?id=${id}`)
    const data = await res.json()

    setTopic(data.metadata?.topic || "")
    setResults(data.metadata?.results || [])
    setOverall(data.stability_score || 0)
    setLoading(false)
  }

  const loadHistory = async (nodeId: string) => {
    const res = await fetch(`/api/probe/history?node_id=${nodeId}`)
    const data = await res.json()

    setHistory(prev => ({
      ...prev,
      [nodeId]: data.history.map((h: any) => h.stability_score)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-neutral-500 text-sm tracking-wide">
          Generating Structural Report...
        </p>
      </div>
    )
  }

  const percentage = Math.round(overall * 100)

  const overallColor =
    percentage >= 80
      ? "text-emerald-400"
      : percentage >= 40
      ? "text-amber-400"
      : "text-rose-400"

  return (
    <div className="space-y-14">

      {/* Header */}
      <div className="border-b border-neutral-800 pb-8 flex justify-between items-center">
        <div>
          <h1 className="text-lg uppercase tracking-widest text-neutral-400">
            Structural Diagnostic Report
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Topic: {topic}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Overall Stability
          </p>
          <p className={`text-4xl font-light ${overallColor}`}>
            {percentage}%
          </p>
        </div>
      </div>

      {/* Node Results */}
      {results.map((node) => {
        const nodePercent = Math.round(node.score * 100)

        const classificationColor =
          node.classification === "Stable"
            ? "text-emerald-400"
            : node.classification === "Weak"
            ? "text-amber-400"
            : "text-rose-400"

        return (
          <div
            key={node.node_id}
            className="border border-neutral-800 bg-neutral-900 p-8 space-y-6"
          >
            {/* Node Header */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <h2 className="text-base text-neutral-200">
                {node.node_name}
              </h2>

              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Stability
                </p>
                <p className="text-xl font-light text-cyan-400">
                  {nodePercent}%
                </p>
              </div>
            </div>

            {/* Classification */}
            <div className={`text-xs uppercase tracking-widest font-semibold ${classificationColor}`}>
              {node.classification}
            </div>

            {/* Trend */}
            <div>
              <button
                onClick={() => loadHistory(node.node_id)}
                className="text-xs text-neutral-500 hover:text-cyan-400 transition"
              >
                View Stability Trend
              </button>

              {history[node.node_id] && (
                <div className="text-xs text-neutral-400 mt-3">
                  {history[node.node_id]
                    .map(v => Math.round(v * 100) + "%")
                    .join(" → ")}
                </div>
              )}
            </div>

            {/* Repair Workspace Entry */}
            {node.classification !== "Stable" && (
              <div className="pt-4 border-t border-neutral-800">
                <button
                  onClick={() =>
                    router.push(
                      `/b2c/repair/${node.node_id}?topic=${encodeURIComponent(
                        topic
                      )}&node=${encodeURIComponent(
                        node.node_name
                      )}&missing=${encodeURIComponent(
                        node.missing_concepts.join(",")
                      )}`
                    )
                  }
                  className="px-6 py-2 border border-cyan-400 text-cyan-400 text-xs uppercase tracking-wider hover:bg-cyan-400 hover:text-neutral-950 transition"
                >
                  Enter Repair Workspace
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}