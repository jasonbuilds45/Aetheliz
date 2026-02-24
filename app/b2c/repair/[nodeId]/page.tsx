"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"

type RepairData = {
  explanation: string
  example: string
  check_question: string
}

export default function RepairPage() {
  const { nodeId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const topic = searchParams.get("topic") || ""
  const nodeName = searchParams.get("node") || ""
  const missing = searchParams.get("missing") || ""

  const [repair, setRepair] = useState<RepairData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateRepair()
  }, [])

  const generateRepair = async () => {
    try {
      const res = await fetch("/api/probe/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          node_name: nodeName,
          missing_concepts: missing.split(",")
        })
      })

      const data = await res.json()
      setRepair(data)
    } catch {
      setRepair(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-slate-500 text-sm">
          Preparing guided clarification...
        </p>
      </div>
    )
  }

  if (!repair) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-rose-600 text-sm">
          Unable to generate repair content.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">
          Guided Repair
        </h1>
        <p className="text-slate-600 text-sm">
          Topic: <span className="font-medium">{topic}</span>
        </p>
        <p className="text-slate-600 text-sm">
          Focus Area: <span className="font-medium">{nodeName}</span>
        </p>
      </div>

      {/* Explanation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Clarified Explanation
        </h2>
        <p className="text-slate-700 text-sm leading-relaxed">
          {repair.explanation}
        </p>
      </div>

      {/* Example */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Worked Example
        </h2>
        <p className="text-slate-700 text-sm leading-relaxed">
          {repair.example}
        </p>
      </div>

      {/* Check Question */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Quick Check
        </h2>
        <p className="text-slate-700 text-sm leading-relaxed">
          {repair.check_question}
        </p>
      </div>

      {/* Back Button */}
      <div className="pt-6">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
        >
          Back to Report
        </button>
      </div>

    </div>
  )
}