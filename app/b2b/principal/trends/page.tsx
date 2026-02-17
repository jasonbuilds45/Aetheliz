
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Stability Trends</h1>
        <p className="text-slate-500 text-sm">Longitudinal analysis of structural knowledge across 12 months.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Aggregate Stability Index</h3>
            <select className="text-xs bg-slate-50 border-none rounded font-bold px-2 py-1 outline-none">
              <option>Last 12 Months</option>
              <option>Last Quarter</option>
            </select>
          </div>
          <div className="flex-1 flex items-end gap-2 px-2">
            {[45, 52, 48, 61, 58, 72, 68, 81, 78, 85, 82, 89].map((val, i) => (
              <div key={i} className="flex-1 group relative">
                <div 
                  className="bg-primary/20 group-hover:bg-primary transition-colors rounded-t-sm w-full" 
                  style={{ height: `${val}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-black text-primary transition-opacity">
                  {val}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary text-white border-none shadow-xl">
            <h3 className="text-[10px] font-black uppercase opacity-60 mb-2">Stability Delta</h3>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black">+14.2%</span>
              <span className="material-symbols-outlined text-emerald-400">trending_up</span>
            </div>
            <p className="text-xs mt-4 opacity-80 leading-relaxed">Structural integrity has increased significantly following the October recalibration cycle.</p>
          </Card>

          <Card>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4">Correlation Factors</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Participation vs Stability</span>
                <span className="font-bold text-emerald-600">0.84</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Repair Frequency</span>
                <span className="font-bold text-amber-600">0.32</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
