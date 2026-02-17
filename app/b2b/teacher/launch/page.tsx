
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/ui/Button';

export default function LaunchProbe() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Probe Launcher</h1>
        <p className="text-slate-500">Configure a structural diagnostic for Section 12-A</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Configuration</h3>
            <div className="space-y-4">
              <Input label="Probe Label" placeholder="e.g. Mid-Term Calculus Verification" icon="label" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Duration (Minutes)" type="number" defaultValue="45" icon="timer" />
                <Input label="Mastery Threshold" type="number" defaultValue="85" icon="verified" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concept Focus</label>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                  {['Differentiation', 'Integration', 'Limits', 'Continuity'].map(c => (
                    <span key={c} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1 cursor-pointer hover:border-primary">
                      {c} <span className="material-symbols-outlined text-[10px]">close</span>
                    </span>
                  ))}
                  <button className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-black hover:bg-primary-700 transition-colors">
                    + Add Concept
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary">Save Draft</Button>
            <Button className="px-12">Initialize Probe</Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <h3 className="text-xs font-black uppercase text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span> Launcher Tips
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Diagnostic probes use "structural forcing" to identify hidden fragility. For mid-term checks, we recommend a <b>threshold of 85%</b> to ensure future dependency stability.
            </p>
          </Card>
          
          <Card>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4">Class Readiness</h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-xs">
                  <span className="font-bold">Students Registered</span>
                  <span className="text-slate-900 dark:text-white font-black">24 / 25</span>
               </div>
               <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[96%]"></div>
               </div>
               <p className="text-[10px] text-slate-400 text-center">1 student missing structural profile</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
