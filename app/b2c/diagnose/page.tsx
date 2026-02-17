
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ActiveDiagnose() {
  const [step, setStep] = useState(1);
  
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-12">
      <header className="flex justify-between items-center px-4">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-primary font-bold">biotech</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Structural Probe</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Focus: Organic Chemistry Fundamentals</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Stability Progress</p>
          <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
             <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(step/12)*100}%` }}></div>
          </div>
        </div>
      </header>

      <Card className="min-h-[400px] flex flex-col justify-between p-12">
        <div className="space-y-8">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded">Question {step} of 12</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Forcing</span>
           </div>
           
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
             How does the presence of a double bond affect the rotational stability of the carbon backbone in a linear alkene?
           </h2>

           <div className="grid grid-cols-1 gap-3">
             {[
               "It increases the stability by locking the rotation into a planar configuration.",
               "It has no effect on rotational stability but affects density.",
               "It decreases stability due to the repulsion of pi-electrons.",
               "It shifts the structural center towards the adjacent sigma bonds."
             ].map((opt, i) => (
               <button key={i} className="group flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary hover:bg-white transition-all text-left">
                 <div className="size-8 rounded-full border-2 border-slate-300 group-hover:border-primary flex items-center justify-center font-bold text-slate-400 group-hover:text-primary transition-colors">
                   {String.fromCharCode(65 + i)}
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900">{opt}</span>
               </button>
             ))}
           </div>
        </div>

        <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
           <Button variant="ghost" onClick={() => step > 1 && setStep(step - 1)}>Previous</Button>
           <Button className="px-12" onClick={() => setStep(step + 1)}>Next Question</Button>
        </div>
      </Card>

      <p className="text-center text-[10px] font-bold text-slate-400 uppercase italic">
        "Structural diagnostics identify the **why**, not just the **what**."
      </p>
    </div>
  );
}
