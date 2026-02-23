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

export default function ReportPage() {
  const { id } = useParams()

  const [topic, setTopic] = useState<string>("")
  const [results, setResults] = useState<NodeResult[]>([])
  const [overall, setOverall] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    try {
      const res = await fetch(`/api/probe/session?id=${id}`)
      const data = await res.json()

      setTopic(data.metadata?.topic || "")
      setResults(data.metadata?.results || [])
      setOverall(data.stability_score || 0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
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

      {/* Report Body */}
      <div className="max-w-6xl mx-auto px-10 py-12 space-y-10">

        {results.map((node) => (
          <div
            key={node.node_id}
            className="bg-white border border-slate-200 p-8 space-y-6"
          >
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

            <div className="flex items-center justify-between">
              <span
                className={`text-sm uppercase tracking-wider font-semibold
                  ${node.classification === "Stable" ? "text-emerald-600" : ""}
                  ${node.classification === "Weak" ? "text-amber-600" : ""}
                  ${node.classification === "Broken" ? "text-red-600" : ""}
                `}
              >
                {node.classification}
              </span>
            </div>

            {node.classification !== "Stable" &&
              node.missing_concepts?.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-6 space-y-4">
                  <p className="text-sm font-semibold tracking-wide">
                    Identified Structural Gaps
                  </p>

                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    {node.missing_concepts.map((c, index) => (
                      <li key={index}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        ))}

      </div>
    </div>
  )
}