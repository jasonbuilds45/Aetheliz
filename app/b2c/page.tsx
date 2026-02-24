'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'

export default function B2CDashboard() {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Progress Overview
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Monitor your structural stability across learning modules.
          </p>
        </div>

        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl">
          Run New Diagnostic
        </Button>
      </div>

      {/* Stability Metric Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          Global Stability Index
        </p>
        <div className="flex items-baseline gap-4">
          <h2 className="text-6xl font-black text-indigo-600">74%</h2>
          <span className="text-sm font-bold text-slate-400">Current Average</span>
        </div>

        <div className="mt-8 h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-3 bg-indigo-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: '74%' }}
          />
        </div>
      </div>

      {/* Recent Diagnostics Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
          Diagnostic History
        </h3>

        <div className="space-y-3">
          <DiagnosticRow title="Organic Chemistry Fundamentals" score="88%" status="stable" />
          <DiagnosticRow title="Thermodynamics II" score="42%" status="broken" />
          <DiagnosticRow title="Quantum Mechanics" score="65%" status="weak" />
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
  const statusStyles = {
    stable: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    weak: 'text-amber-600 bg-amber-50 border-amber-100',
    broken: 'text-rose-600 bg-rose-50 border-rose-100',
  }

  return (
    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl transition-all hover:border-slate-200 hover:shadow-sm">
      <span className="text-sm font-bold text-slate-700">{title}</span>
      <span className={`px-4 py-1.5 rounded-lg text-sm font-black border ${statusStyles[status]}`}>
        {score}
      </span>
    </div>
  )
}