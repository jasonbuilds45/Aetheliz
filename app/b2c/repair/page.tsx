
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function RepairPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Structural Repair</h1>
          <p className="text-slate-500 text-sm">Re-stabilizing fragile concepts through targeted clarification.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg">
           <span className="material-symbols-outlined text-rose-500">warning</span>
           <span className="text-xs font-black text-rose-600 uppercase">2 Concepts Require Intervention</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-l-4 border-l-rose-500">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Repair</span>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thermodynamics II</h2>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-rose-500 uppercase">Current Stability</p>
                 <p className="text-xl font-black">42%</p>
              </div>
           </div>
           
           <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                "The relationship between Gibbs Free Energy and equilibrium constants seems structurally sound, but the application to non-ideal gas behavior shows <b>high variability</b> in response patterns."
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400">Targeted Inquiry</h4>
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
                  <p className="text-sm font-bold text-slate-800 dark:text-white mb-4">How does the fugacity coefficient compensate for molecular attraction in the van der Waals model?</p>
                  <textarea 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-0 resize-none min-h-[120px]"
                    placeholder="Provide your structural explanation..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button className="px-8">Submit for Evaluation</Button>
              </div>
           </div>
        </Card>

        <div className="space-y-6">
           <Card>
              <h3 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">Repair Queue</h3>
              <div className="space-y-4">
                 {[
                   { name: 'Linear Algebra (Eigenspaces)', date: 'Nov 12, 2023', risk: 'Medium' },
                   { name: 'Organic Chemistry (Acidity)', date: 'Nov 14, 2023', risk: 'Low' }
                 ].map(item => (
                   <div key={item.name} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{item.date}</p>
                      </div>
                      <span className={`px-2 py-1 text-[8px] font-black uppercase rounded border ${item.risk === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                        {item.risk} Risk
                      </span>
                   </div>
                 ))}
              </div>
           </Card>
           
           <Card className="bg-emerald-50 border-emerald-100">
              <h3 className="text-xs font-black uppercase text-emerald-600 mb-4">Resolved Recently</h3>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                    Stoichiometry (Stability +14%)
                 </div>
                 <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                    Atomic Theory (Stability +8%)
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
