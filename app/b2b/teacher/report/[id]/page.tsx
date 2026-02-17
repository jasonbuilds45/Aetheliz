
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function DiagnosticReport({ params }: { params: { id: string } }) {
  const students = [
    { name: 'Arthur Penhaligon', stability: 82, fragility: 12, status: 'Stable' },
    { name: 'Leila Sabatier', stability: 45, fragility: 42, status: 'Fragile' },
    { name: 'Marcus Aurelius', stability: 94, fragility: 4, status: 'Mastery' },
    { name: 'Hester Prynne', stability: 68, fragility: 22, status: 'Risk' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Diagnostic Report</span>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Section 12-A: Algebra II</h1>
          <p className="text-slate-500 text-sm">Probe ID: {params.id} • Completed Nov 15, 2023</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50">
             <span className="material-symbols-outlined text-sm">download</span> Export PDF
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Student Breakdown</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="size-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-bold text-slate-400">STABLE</span></div>
                <div className="flex items-center gap-2"><div className="size-2 bg-rose-500 rounded-full"></div><span className="text-[10px] font-bold text-slate-400">FRAGILE</span></div>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Stability Index</th>
                  <th className="px-6 py-3">Gap Analysis</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{s.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black">{s.stability}%</span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${s.stability > 80 ? 'bg-emerald-500' : s.stability > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.stability}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 italic">Structural mismatch in matrices...</td>
                    <td className="px-6 py-4">
                      <button className="p-1 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">analytics</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-none">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4">Class Insights</h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-black">74.2%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Class Stability</p>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-2">
                <p className="text-xs text-slate-400 italic">"The cohort is struggling with **Dependency 12.B** (Complex Numbers). We recommend a 15-minute recalibration session."</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
