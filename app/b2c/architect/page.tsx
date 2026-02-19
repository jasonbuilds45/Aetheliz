
'use client';

import React from 'react';
import { ArchitectGraph } from '@/components/architect/ArchitectGraph';
import { Card } from '@/components/ui/Card';

export default function ArchitectPage() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Graph Architect</h1>
          <p className="text-slate-500 text-sm">Visualizing your knowledge dependencies and growth vectors.</p>
        </div>
        <div className="flex gap-2">
           <button className="size-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50">
             <span className="material-symbols-outlined text-slate-600">zoom_in</span>
           </button>
           <button className="size-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50">
             <span className="material-symbols-outlined text-slate-600">zoom_out</span>
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ArchitectGraph />
        </div>
        <div className="space-y-6">
          <Card>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Active Focus</h3>
            <div className="space-y-4">
               <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-xs font-black text-primary uppercase mb-1">Current Node</p>
                  <h4 className="font-bold text-slate-900 dark:text-white">Aromatic Compounds</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[45%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">45%</span>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Prerequisites</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Resonance Structures
                    </li>
                    <li className="flex items-center gap-2 text-xs font-bold text-amber-600">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Hybridization Theory
                    </li>
                  </ul>
               </div>
            </div>
          </Card>
          
          <Card className="bg-slate-900 text-white border-none shadow-xl">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2">Discovery Queue</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed italic">The following nodes are locked until your foundation stabilizes to &gt; 80%.</p>
            <div className="space-y-2">
              {['Electrophilic Substitution', 'Phenols & Ethers'].map(node => (
                <div key={node} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10 opacity-50">
                  <span className="text-xs font-bold">{node}</span>
                  <span className="material-symbols-outlined text-sm">lock</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
