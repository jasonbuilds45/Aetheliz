'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function B2CDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter italic">Your Progress</h1>
          <p className="text-slate-500">Self-guided structural diagnostic profile</p>
        </div>
        <Button variant="primary">Start New Probe</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary to-primary-800 text-white border-none shadow-xl">
          <p className="text-xs font-bold uppercase opacity-70 mb-1">Knowledge Stability</p>
          <h3 className="text-4xl font-black mb-4">74%</h3>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full" style={{ width: '74%' }}></div>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <h3 className="font-bold mb-4 text-slate-800 dark:text-white uppercase text-xs tracking-widest">Recent Diagnostics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm">Organic Chemistry Fundamentals</span>
              <span className="text-emerald-600 font-black text-lg">88%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-sm">Thermodynamics II</span>
              <span className="text-rose-500 font-black text-lg">42%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
