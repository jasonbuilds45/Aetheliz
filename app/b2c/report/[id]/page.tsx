"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Question = {
  type: "mcq" | "short"
  question: string
  options?: string[]
  correct_answer?: string
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

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    const res = await fetch(`/api/probe/session?id=${id}`)
    const data = await res.json()
    setProbes(data.probes || [])
    setLoading(false)
  }

  const handleMCQ = (nodeId: string, index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${nodeId}-${index}`]: value
    }))
  }

  const handleShort = (nodeId: string, index: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${nodeId}-${index}`]: value
    }))
  }

  const submitSession = async () => {
    const res = await fetch("/api/probe/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: id,
        answers
      })
    })

    const data = await res.json()

    router.push(`/b2c/report/${id}`)
  }

  if (loading) return <div className="p-10">Loading probe...</div>

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-10">
      <h1 className="text-2xl font-bold">Calibration Probe</h1>

      {probes.map((node) => (
        <div key={node.node_id} className="border rounded p-6 space-y-6">
          <h2 className="font-semibold text-lg">{node.node_name}</h2>

          {node.questions.map((q, i) => (
            <div key={i} className="space-y-3">
              <p className="font-medium">{q.question}</p>

              {q.type === "mcq" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className="block">
                      <input
                        type="radio"
                        name={`${node.node_id}-${i}`}
                        value={opt}
                        onChange={(e) =>
                          handleMCQ(node.node_id, i, e.target.value)
                        }
                      />
                      <span className="ml-2">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "short" && (
                <textarea
                  className="w-full border rounded p-3"
                  rows={4}
                  onChange={(e) =>
                    handleShort(node.node_id, i, e.target.value)
                  }
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={submitSession}
        className="bg-primary text-white px-8 py-3 rounded font-semibold"
      >
        Submit Calibration
      </button>
    </div>
  )
}