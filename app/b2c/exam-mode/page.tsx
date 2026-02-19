'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ExamModePage() {
  const [isActive, setIsActive] = useState(false)

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12">
      {!isActive ? (
        <div className="text-center space-y-6">
          <div className="size-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-rose-100 animate-pulse">
            <span className="material-symbols-outlined text-4xl">timer_off</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            Exam Protocol Required
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
            This diagnostic cycle requires a high-stakes protocol. Exam Mode disables Graph Architect
            hints and enforces a structural time-limit.
          </p>
          <Card className="max-w-sm mx-auto p-6 bg-slate-50 text-left">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Protocol Rules</h3>
            <ul className="space-y-2 text-xs font-bold text-slate-600">
              <li className="flex gap-2"><span>•</span> No Repair Panel access</li>
              <li className="flex gap-2"><span>•</span> Static threshold (90%)</li>
              <li className="flex gap-2"><span>•</span> Single attempt per node</li>
            </ul>
          </Card>
          <Button className="px-16" onClick={() => setIsActive(true)}>Authorize Protocol</Button>
        </div>
      ) : (
        <div className="space-y-8 transition-opacity duration-500 opacity-100">
          <header className="flex justify-between items-center border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded animate-pulse">
                LIVE EXAM
              </div>
              <h2 className="text-xl font-bold italic uppercase tracking-tight">Thermodynamics Final</h2>
            </div>
            <div className="text-2xl font-black text-rose-500 tracking-tighter">44:59</div>
          </header>

          <Card className="p-12 min-h-[400px]">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold leading-tight">
                Derive the relationship between the Joule-Thomson coefficient and the isobaric heat
                capacity for a real gas system.
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {['Option A', 'Option B', 'Option C', 'Option D'].map((o) => (
                  <div
                    key={o}
                    className="p-4 border border-slate-200 rounded-lg font-bold text-sm cursor-pointer hover:border-primary transition-colors"
                  >
                    {o}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
