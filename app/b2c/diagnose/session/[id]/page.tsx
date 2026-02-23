"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Question = {
  type: "mcq" | "short"
  question: string
  options?: string[]
}

type NodeProbe = {
  node_id: string
  node_name: string
  questions: Question[]
}

export default function DiagnoseSessionPage() {
  const { id } = useParams()
  const router = useRouter()

  const [probes, setProbes] = useState<NodeProbe[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/probe/session?id=${id}`)
      const data = await res.json()
      setProbes(data.probes || [])
    } catch {
      setProbes([])
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (nodeId: string, index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${nodeId}-${index}`]: value
    }))
  }

  const submitSession = async () => {
    setSubmitting(true)

    await fetch("/api/probe/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: id,
        answers
      })
    })

    router.push(`/b2c/report/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <p className="text-slate-600 tracking-wide">
          Initializing Structural Calibration...
        </p>
      </div>
    )
  }

  const totalNodes = probes.length

  return (
    <div className="min-h-screen bg-background-light">
      {/* Top Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-10 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-wide">
              STRUCTURAL CALIBRATION
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Session ID: {id}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Nodes
            </p>
            <p className="text-lg font-semibold">
              {totalNodes}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-10 py-12 space-y-12">

        {probes.map((node, nodeIndex) => (
          <div
            key={node.node_id}
            className="bg-white border border-slate-200 rounded-sm p-8 space-y-8"
          >
            {/* Node Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-semibold tracking-wide">
                {node.node_name}
              </h2>

              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Node {nodeIndex + 1} / {totalNodes}
              </span>
            </div>

            {/* Questions */}
            <div className="space-y-8">
              {node.questions.map((q, i) => (
                <div key={i} className="space-y-4">
                  <p className="font-medium text-slate-800">
                    {q.question}
                  </p>

                  {q.type === "mcq" && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                        >
                          <input
                            type="radio"
                            name={`${node.node_id}-${i}`}
                            value={opt}
                            onChange={(e) =>
                              handleAnswer(node.node_id, i, e.target.value)
                            }
                            className="mr-3"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "short" && (
                    <textarea
                      rows={5}
                      className="w-full border border-slate-200 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
                      placeholder="Provide a structured explanation..."
                      onChange={(e) =>
                        handleAnswer(node.node_id, i, e.target.value)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Submit Section */}
        <div className="flex justify-end pt-8 border-t">
          <button
            onClick={submitSession}
            disabled={submitting}
            className="px-8 py-3 bg-slate-900 text-white text-sm uppercase tracking-wider hover:bg-slate-800 transition disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Complete Calibration"}
          </button>
        </div>

      </div>
    </div>
  )
}