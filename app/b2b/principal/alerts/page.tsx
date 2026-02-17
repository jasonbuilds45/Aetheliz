
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function AlertsPage() {
  const alerts = [
    { id: 1, type: 'CRITICAL', title: 'Calculus I Fragility Spike', group: 'Grade 12-A', time: '2h ago', message: 'Mastery stability dropped below 40% across 65% of students.' },
    { id: 2, type: 'WARNING', title: 'Low Participation', group: 'Section 9-C', time: '5h ago', message: 'Diagnostic probe "Atomic Theory" has < 20% completion rate.' },
    { id: 3, type: 'INFO', title: 'Stability Threshold Reached', group: 'Grade 11-B', time: '1d ago', message: 'Algebraic reasoning reached the 85% target threshold.' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Structural Alerts</h1>
          <p className="text-slate-500 text-sm">Critical interventions identified by the diagnostic engine.</p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase rounded-lg hover:bg-slate-800 transition-colors">
          Clear All
        </button>
      </header>

      <div className="space-y-4">
        {alerts.map(alert => (
          <Card key={alert.id} className={`border-l-4 ${alert.type === 'CRITICAL' ? 'border-l-rose-500' : alert.type === 'WARNING' ? 'border-l-amber-500' : 'border-l-primary'}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`size-10 rounded-full flex items-center justify-center ${alert.type === 'CRITICAL' ? 'bg-rose-50 text-rose-500' : alert.type === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-primary/5 text-primary'}`}>
                  <span className="material-symbols-outlined">
                    {alert.type === 'CRITICAL' ? 'error' : alert.type === 'WARNING' ? 'warning' : 'info'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{alert.type}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-500">{alert.group}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{alert.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">{alert.message}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.time}</span>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase rounded hover:bg-slate-200 transition-colors">Dismiss</button>
                  <button className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase rounded hover:bg-primary-700 transition-colors">Intervene</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
