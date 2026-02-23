"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

type NodeResult = {
  node_id: string
  node_name: string
  score: number
  classification: "Stable" | "Weak" | "Broken"
  missing_concepts: string[]
}

type RepairData = {
  explanation: string
  example: string
  check_question: string
}

export default function ReportPage() {
  const { id } = useParams()

  const [topic, setTopic] = useState("")
  const [results, setResults] = useState<NodeResult[]>([])
  const [overall, setOverall] = useState(0)
  const [loading, setLoading] = useState(true)

  const [repairData, setRepairData] = useState<Record<string, RepairData>>({})
  const [loadingRepair, setLoadingRepair] = useState<string | null>(null)

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

  const initiateRepair = async (node: NodeResult) => {
    setLoadingRepair(node.node_id)

    const res = await fetch("/api/probe/repair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        node_name: node.node_name,
        missing_concepts: node.missing_concepts
      })
    })

    const data = await res.json()

    setRepairData(prev => ({
      ...prev,
      [node.node_id]: data
    }))

    setLoadingRepair(null)
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
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <p className="text-slate-600 tracking-wide">
          Generating Structural Report...
        </p>
      </div>
    )
  }

  const percentage = Math.round(overall * 100)

  return (
    <div className="min-h-screen bg-background-light">

      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-10 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-wide">
              STRUCTURAL DIAGNOSTIC REPORT
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Topic: {topic}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Overall Stability
            </p>
            <p className="text-2xl font-semibold">
              {percentage}%
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-10 py-12 space-y-10">

        {results.map((node) => (
          <div
            key={node.node_id}
            className="bg-white border border-slate-200 p-8 space-y-6"
          >
            {/* Node Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-semibold tracking-wide">
                {node.node_name}
              </h2>

              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Stability
                </p>
                <p className="font-semibold">
                  {Math.round(node.score * 100)}%
                </p>
              </div>
            </div>

            {/* Classification */}
            <span
              className={`text-sm uppercase tracking-wider font-semibold
                ${node.classification === "Stable" ? "text-emerald-600" : ""}
                ${node.classification === "Weak" ? "text-amber-600" : ""}
                ${node.classification === "Broken" ? "text-red-600" : ""}
              `}
            >
              {node.classification}
            </span>

            {/* Trend Button */}
            <div>
              <button
                onClick={() => loadHistory(node.node_id)}
                className="text-xs underline text-slate-500"
              >
                View Stability Trend
              </button>

              {history[node.node_id] && (
                <div className="text-sm text-slate-600 mt-2">
                  Trend:{" "}
                  {history[node.node_id]
                    .map(v => Math.round(v * 100) + "%")
                    .join(" → ")}
                </div>
              )}
            </div>

            {/* Repair Section */}
            {node.classification !== "Stable" && (
              <div className="space-y-6">

                <button
                  onClick={() => initiateRepair(node)}
                  className="px-6 py-2 border border-slate-300 text-sm uppercase tracking-wider hover:bg-slate-100 transition"
                >
                  {loadingRepair === node.node_id
                    ? "Generating Repair..."
                    : "Initiate Structural Repair"}
                </button>

                {repairData[node.node_id] && (
                  <div className="bg-slate-50 border border-slate-200 p-6 space-y-4">
                    <div>
                      <p className="font-semibold">Focused Explanation</p>
                      <p className="text-sm text-slate-700 mt-2">
                        {repairData[node.node_id].explanation}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Worked Example</p>
                      <p className="text-sm text-slate-700 mt-2">
                        {repairData[node.node_id].example}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold">Verification Question</p>
                      <p className="text-sm text-slate-700 mt-2">
                        {repairData[node.node_id].check_question}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        ))}

      </div>
    </div>
  )
}