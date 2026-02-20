"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type NodeResult = {
  node_id: string
  node_name: string
  score: number
  classification: string
  missing_concepts: string[]
}

export default function ReportPage() {
  const { id } = useParams()
  const router = useRouter()

  const [results, setResults] = useState<NodeResult[]>([])
  const [overall, setOverall] = useState<number>(0)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    const res = await fetch(`/api/probe/report?id=${id}`)
    const data = await res.json()
    setResults(data.nodes)
    setOverall(data.overall_score)
  }

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-10">
      <h1 className="text-3xl font-bold">Stability Report</h1>

      <div className="text-xl">
        Overall Stability: <strong>{Math.round(overall * 100)}%</strong>
      </div>

      <div className="space-y-6">
        {results.map(node => (
          <div key={node.node_id} className="border p-6 rounded space-y-4">
            <div className="flex justify-between">
              <h2 className="font-semibold">{node.node_name}</h2>
              <span>{Math.round(node.score * 100)}%</span>
            </div>

            <p>Status: {node.classification}</p>

            {node.missing_concepts.length > 0 && (
              <div>
                <p className="text-sm text-red-600">
                  Missing Dependencies:
                </p>
                <ul className="list-disc ml-5">
                  {node.missing_concepts.map(m => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>

                <button
                  onClick={() =>
                    router.push(`/b2c/repair/${node.node_id}`)
                  }
                  className="mt-3 bg-primary text-white px-4 py-2 rounded"
                >
                  Repair Understanding
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}