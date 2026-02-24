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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-slate-500 text-sm">
          Generating your understanding report...
        </p>
      </div>
    )
  }

  const percentage = Math.round(overall * 100)

  const strong = results.filter(r => r.classification === "Stable")
  const partial = results.filter(r => r.classification === "Weak")
  const weak = results.filter(r => r.classification === "Broken")

  const overallColor =
    percentage >= 80
      ? "text-emerald-600"
      : percentage >= 40
      ? "text-amber-600"
      : "text-rose-600"

  return (
    <div className="max-w-4xl mx-auto space-y-16">

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">
          Understanding Report
        </h1>
        <p className="text-slate-600 text-sm">
          Topic: <span className="font-medium">{topic}</span>
        </p>
      </div>

      {/* Overall Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Overall Understanding
          </p>
          <p className={`text-4xl font-semibold ${overallColor}`}>
            {percentage}%
          </p>
        </div>

        <div className="text-sm text-slate-600 max-w-sm">
          {percentage >= 80 &&
            "You demonstrate strong conceptual understanding across most areas."}
          {percentage >= 40 && percentage < 80 &&
            "You understand several areas well, but some concepts need reinforcement."}
          {percentage < 40 &&
            "There are key conceptual gaps that need focused clarification."}
        </div>
      </div>

      {/* Strong Areas */}
      {strong.length > 0 && (
        <Section title="Strong Understanding" color="emerald">
          {strong.map(node => (
            <ConceptCard key={node.node_id} node={node} />
          ))}
        </Section>
      )}

      {/* Partial */}
      {partial.length > 0 && (
        <Section title="Partial Understanding" color="amber">
          {partial.map(node => (
            <ConceptCard key={node.node_id} node={node} router={router} topic={topic} />
          ))}
        </Section>
      )}

      {/* Weak */}
      {weak.length > 0 && (
        <Section title="Needs Attention" color="rose">
          {weak.map(node => (
            <ConceptCard key={node.node_id} node={node} router={router} topic={topic} />
          ))}
        </Section>
      )}

    </div>
  )
}

function Section({
  title,
  color,
  children
}: {
  title: string
  color: "emerald" | "amber" | "rose"
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <h2 className={`text-lg font-semibold text-${color}-600`}>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ConceptCard({
  node,
  router,
  topic
}: {
  node: NodeResult
  router?: any
  topic?: string
}) {
  const percent = Math.round(node.score * 100)

  const color =
    node.classification === "Stable"
      ? "emerald"
      : node.classification === "Weak"
      ? "amber"
      : "rose"

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
      <div>
        <h3 className="text-slate-900 font-medium">
          {node.node_name}
        </h3>
        <p className={`text-sm text-${color}-600 mt-1`}>
          {percent}% understanding
        </p>
      </div>

      {node.classification !== "Stable" && router && topic && (
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
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Guided Repair
        </button>
      )}
    </div>
  )
}