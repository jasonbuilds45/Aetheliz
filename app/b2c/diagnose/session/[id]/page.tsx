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
      <div className="flex items-center justify-center py-40">
        <p className="text-neutral-500 text-sm tracking-wide">
          Initializing Structural Calibration...
        </p>
      </div>
    )
  }

  const totalNodes = probes.length

  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-lg tracking-widest uppercase text-neutral-300">
            Structural Calibration
          </h1>
          <p className="text-xs text-neutral-500 mt-2">
            Session: {id}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Nodes
          </p>
          <p className="text-2xl font-light text-cyan-400">
            {totalNodes}
          </p>
        </div>
      </div>

      {/* Node Blocks */}
      {probes.map((node, nodeIndex) => (
        <div
          key={node.node_id}
          className="border border-neutral-800 bg-neutral-900 p-8 space-y-8"
        >

          {/* Node Header */}
          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <h2 className="text-base font-medium text-neutral-200">
              {node.node_name}
            </h2>

            <span className="text-xs text-neutral-500 uppercase tracking-wider">
              Node {nodeIndex + 1} / {totalNodes}
            </span>
          </div>

          {/* Questions */}
          <div className="space-y-10">
            {node.questions.map((q, i) => {
              const key = `${node.node_id}-${i}`
              const selected = answers[key]

              return (
                <div key={i} className="space-y-5">
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {q.question}
                  </p>

                  {q.type === "mcq" && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt) => {
                        const isSelected = selected === opt

                        return (
                          <label
                            key={opt}
                            className={`border px-4 py-3 cursor-pointer transition-all duration-150 text-sm
                              ${isSelected
                                ? "border-cyan-400 bg-neutral-800 text-cyan-400"
                                : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800"}
                            `}
                          >
                            <input
                              type="radio"
                              name={key}
                              value={opt}
                              onChange={(e) =>
                                handleAnswer(node.node_id, i, e.target.value)
                              }
                              className="hidden"
                            />
                            {opt}
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {q.type === "short" && (
                    <textarea
                      rows={5}
                      className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-cyan-400 resize-none transition-colors"
                      placeholder="Provide a structured explanation..."
                      onChange={(e) =>
                        handleAnswer(node.node_id, i, e.target.value)
                      }
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Submit */}
      <div className="flex justify-end pt-10 border-t border-neutral-800">
        <button
          onClick={submitSession}
          disabled={submitting}
          className="px-8 py-3 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-neutral-950 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Evaluating Stability..." : "Complete Calibration"}
        </button>
      </div>

    </div>
  )
}