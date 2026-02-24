"use client"

import { useEffect, useMemo, useState } from "react"
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
      setProbes(data.metadata?.probes || [])
    } catch {
      setProbes([])
    } finally {
      setLoading(false)
    }
  }

  /* Flatten questions */
  const flatQuestions = useMemo(() => {
    const list: {
      key: string
      question: Question
    }[] = []

    probes.forEach((node) => {
      node.questions.forEach((q, index) => {
        list.push({
          key: `${node.node_id}-${index}`,
          question: q,
        })
      })
    })

    return list
  }, [probes])

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const submitSession = async () => {
    setSubmitting(true)

    await fetch("/api/probe/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: id,
        answers,
      }),
    })

    router.push(`/b2c/report/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-slate-500 text-sm">
          Preparing your assessment...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-14">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Understanding Assessment
        </h1>
        <p className="text-sm text-slate-600">
          Answer each question thoughtfully. Subtopics will be revealed in your report.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-12">
        {flatQuestions.map((item, index) => {
          const selected = answers[item.key]

          return (
            <div
              key={item.key}
              className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                Question {index + 1} of {flatQuestions.length}
              </div>

              <p className="text-slate-800 text-sm leading-relaxed">
                {item.question.question}
              </p>

              {item.question.type === "mcq" &&
                item.question.options && (
                  <div className="grid gap-3">
                    {item.question.options.map((opt) => (
                      <label
                        key={opt}
                        className={`border px-4 py-3 rounded-lg cursor-pointer transition text-sm
                          ${
                            selected === opt
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-300 text-slate-600 hover:border-indigo-400"
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={item.key}
                          value={opt}
                          onChange={(e) =>
                            handleAnswer(item.key, e.target.value)
                          }
                          className="hidden"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

              {item.question.type === "short" && (
                <textarea
                  rows={5}
                  className="w-full border border-slate-300 px-4 py-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Explain in your own words..."
                  onChange={(e) =>
                    handleAnswer(item.key, e.target.value)
                  }
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-6">
        <button
          onClick={submitSession}
          disabled={submitting}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {submitting ? "Analyzing..." : "Submit Assessment"}
        </button>
      </div>

    </div>
  )
}