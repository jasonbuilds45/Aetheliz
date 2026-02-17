
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { getConceptStability } from '@/services/diagnosticQueries';
import { Concept } from '@/types';

export default function FragilityRanking() {
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    getConceptStability().then(setConcepts);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Fragility Index</h1>
        <p className="text-slate-500 text-sm">Priority-sorted concept vulnerabilities across the organization.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {concepts.sort((a, b) => b.fragility - a.fragility).map((concept, idx) => (
          <Card key={idx} className="hover:border-primary/30 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`size-12 rounded-lg flex items-center justify-center font-black text-xl ${concept.fragility > 30 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                  #{idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{concept.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                     <span className="text-[10px] font-bold uppercase text-slate-400">Stability: {concept.stability}%</span>
                     <span className="text-[10px] font-bold uppercase text-rose-500">Fragility: {concept.fragility}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                   <span className="text-xs font-bold text-slate-400">Involvement</span>
                   <span className="text-sm font-black text-slate-700">1,200 Students</span>
                </div>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
