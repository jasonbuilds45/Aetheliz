
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function DiagnosticHistory() {
  const history = [
    { id: 'h1', name: 'Organic Chem I', date: 'Oct 12, 2023', score: 85, stability: '+4%', status: 'Stable' },
    { id: 'h2', name: 'Quantum Basics', date: 'Oct 28, 2023', score: 42, stability: '-12%', status: 'Fragile' },
    { id: 'h3', name: 'Fluid Dynamics', date: 'Nov 04, 2023', score: 91, stability: '+2%', status: 'Mastery' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Diagnostic Archive</h1>
        <p className="text-slate-500 text-sm">Review historical structural fingerprints and growth cycles.</p>
      </header>

      <div className="space-y-4">
        {history.map(item => (
          <Card key={item.id} className="hover:border-primary/20 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`size-12 rounded-xl flex items-center justify-center font-black ${item.score > 80 ? 'bg-emerald-50 text-emerald-600' : item.score > 50 ? 'bg-slate-50 text-slate-400' : 'bg-rose-50 text-rose-500'}`}>
                   {item.score}%
                </div>
                <div>
                   <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{item.name}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date} • {item.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase">Delta</p>
                   <p className={`text-sm font-black ${item.stability.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {item.stability}
                   </p>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
