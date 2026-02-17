
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function RecalibrationPage({ params }: { params: { id: string } }) {
  const [threshold, setThreshold] = useState(85);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary">settings_backup_restore</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Recalibration</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Recalibrate: Organic Foundations</h1>
        <p className="text-slate-500 text-sm">Adjusting the diagnostic forcing parameters for Section 12-A.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black uppercase text-slate-400">Mastery Forcing Threshold</h3>
               <span className="text-2xl font-black text-primary italic">{threshold}%</span>
            </div>
            
            <input 
              type="range" 
              min="50" 
              max="100" 
              value={threshold} 
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary mb-8"
            />
            
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Current Variance</p>
                  <p className="text-sm font-bold text-rose-500">±14% (High Risk)</p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Projected Stability</p>
                  <p className="text-sm font-bold text-emerald-500">+8.4% Post-Cycle</p>
               </div>
            </div>
          </Card>

          <Card className="bg-slate-50 border-dashed border-2">
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4">Structural Dependencies Affected</h3>
            <div className="space-y-3">
               {['Mechanism A12', 'Kinetic Theory', 'Catalysis'].map(dep => (
                 <div key={dep} className="flex justify-between text-xs font-bold text-slate-600">
                   <span>{dep}</span>
                   <span className="text-primary tracking-tighter">IMPACTED</span>
                 </div>
               ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-white border-none shadow-xl">
             <h3 className="text-[10px] font-black uppercase opacity-60 mb-2">Recalibration Logic</h3>
             <p className="text-xs leading-relaxed italic">
               Increasing the threshold forces the diagnostic engine to probe deeper into student "guess-patterns", surfacing hidden fragility in the prerequisite layer.
             </p>
          </Card>
          <Button className="w-full">Initialize Cycle</Button>
        </div>
      </div>
    </div>
  );
}
