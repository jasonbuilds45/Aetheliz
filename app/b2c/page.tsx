'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

export default function B2CDashboard() {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">
            Progress Overview
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Structural stability across diagnosed topics
          </p>
        </div>

        <Button variant="primary">Run Diagnostic</Button>
      </div>

      {/* Stability Card */}
      <div className="border border-neutral-800 bg-neutral-900 p-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
          Overall Stability
        </p>
        <h2 className="text-5xl font-light text-cyan-400">74%</h2>

        <div className="mt-6 h-1 w-full bg-neutral-800">
          <div
            className="h-1 bg-cyan-400 transition-all duration-500"
            style={{ width: '74%' }}
          />
        </div>
      </div>

      {/* Recent Diagnostics */}
      <div className="border border-neutral-800 bg-neutral-900 p-8">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-6">
          Recent Diagnostics
        </h3>

        <div className="space-y-4">
          <DiagnosticRow
            title="Organic Chemistry Fundamentals"
            score="88%"
            status="stable"
          />
          <DiagnosticRow
            title="Thermodynamics II"
            score="42%"
            status="broken"
          />
        </div>
      </div>
    </div>
  )
}

function DiagnosticRow({
  title,
  score,
  status,
}: {
  title: string
  score: string
  status: 'stable' | 'weak' | 'broken'
}) {
  const color =
    status === 'stable'
      ? 'text-emerald-400'
      : status === 'weak'
      ? 'text-yellow-400'
      : 'text-rose-400'

  return (
    <div className="flex justify-between items-center border border-neutral-800 px-4 py-3 hover:bg-neutral-800 transition-colors duration-150">
      <span className="text-sm text-neutral-200">{title}</span>
      <span className={`text-lg font-light ${color}`}>{score}</span>
    </div>
  )
}