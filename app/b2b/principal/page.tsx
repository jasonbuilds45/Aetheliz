'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { getConceptStability } from '@/services/diagnosticQueries'
import type { Concept } from '@/types'

export default function PrincipalDashboard() {
  const [concepts, setConcepts] = useState<Concept[]>([])

  useEffect(() => {
    getConceptStability().then(setConcepts)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
          Academic Overview
        </h1>
        <p className="text-slate-500 text-sm">Real-time cohort diagnostics for your institution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon="shield_with_heart" label="Stability Score"  value="82.4%" trend="+1.2%" trendUp />
        <MetricCard icon="query_stats"       label="Diagnostics"      value="4,120"  trend="+150"  trendUp />
        <MetricCard icon="groups"            label="Participation"    value="98.2%" trend="+0.4%" trendUp />
        <MetricCard icon="warning"           label="Active Alerts"    value="14"    trend="-2"    trendUp={false} isDanger />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white">Top Fragile Concepts</h3>
            <button className="text-primary text-xs font-semibold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Concept</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stability</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Fragility</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {concepts.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-slate-600 dark:text-slate-400">{c.stability}%</td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600 dark:text-slate-400">{c.fragility}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${
                        c.fragility > 30
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                        {c.fragility > 30 ? 'High Risk' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                ))}
                {concepts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No diagnostic data yet. Launch a probe to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Cross-Section Comparison</h3>
            <p className="text-xs text-slate-500">Stability index by grade level</p>
          </div>
          <div className="space-y-5">
            <ProgressBar label="Grade 12" value={89} />
            <ProgressBar label="Grade 11" value={76} />
            <ProgressBar label="Grade 10" value={84} />
            <ProgressBar label="Grade 9"  value={68} />
          </div>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, trend, trendUp, isDanger = false }: {
  icon: string; label: string; value: string; trend: string; trendUp: boolean; isDanger?: boolean
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <span className={`material-symbols-outlined ${isDanger ? 'text-rose-500' : 'text-primary/60'}`}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
        <p className={`${trendUp ? 'text-emerald-600' : 'text-rose-600'} text-sm font-medium flex items-center gap-0.5`}>
          <span className="material-symbols-outlined text-sm">{trendUp ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </p>
      </div>
      <p className="text-xs text-slate-400 mt-2">vs last period</p>
    </Card>
  )
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-primary font-bold">{value}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
