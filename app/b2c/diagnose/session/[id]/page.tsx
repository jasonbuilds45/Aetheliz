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
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

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

  // Flatten questions
  const flatQuestions = useMemo(() => {
    const list: {
      key: string
      nodeName: string
      question: Question
    }[] = []

    probes.forEach((node) => {
      node.questions.forEach((q, index) => {
        list.push({
          key: `${node.node_id}-${index}`,
          nodeName: node.node_name,
          question: q,
        })
      })
    })

    return list
  }, [probes])

  const total = flatQuestions.length
  const current = flatQuestions[currentIndex]
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  const handleAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const next = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const back = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
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

  if (!current) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-slate-500 text-sm">
          No questions available.
        </p>
      </div>
    )
  }

  const selected = answers[current.key]
  const isAnswered =
    current.question.type === "short"
      ? !!answers[current.key]?.trim()
      : !!answers[current.key]

  return (
    <div className="max-w-2xl mx-auto space-y-12">

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Understanding Assessment
        </h1>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>
              Question {currentIndex + 1} of {total}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 transition-all">

        <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
          {current.nodeName}
        </div>

        <p className="text-slate-800 text-sm leading-relaxed">
          {current.question.question}
        </p>

        {current.question.type === "mcq" &&
          current.question.options && (
            <div className="grid gap-3">
              {current.question.options.map((opt) => (
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
                    name={current.key}
                    value={opt}
                    onChange={(e) =>
                      handleAnswer(current.key, e.target.value)
                    }
                    className="hidden"
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}

        {current.question.type === "short" && (
          <textarea
            rows={5}
            value={answers[current.key] || ""}
            className="w-full border border-slate-300 px-4 py-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Explain in your own words..."
            onChange={(e) =>
              handleAnswer(current.key, e.target.value)
            }
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">

        <button
          onClick={back}
          disabled={currentIndex === 0}
          className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 disabled:opacity-40"
        >
          Back
        </button>

        {currentIndex < total - 1 ? (
          <button
            onClick={next}
            disabled={!isAnswered}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submitSession}
            disabled={!isAnswered || submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-40"
          >
            {submitting ? "Analyzing..." : "Submit Assessment"}
          </button>
        )}
      </div>

    </div>
  )
}