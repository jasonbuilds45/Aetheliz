
import React from 'react';
import { Card } from '../ui/Card';

export const ArchitectGraph: React.FC = () => {
  return (
    <Card className="h-[600px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 border-dashed border-2 relative">
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold uppercase">Foundation</span>
        <span className="px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-bold uppercase text-primary">Active</span>
      </div>
      <div className="text-center space-y-4">
        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <span className="material-symbols-outlined text-4xl text-primary">account_tree</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Graph Architect Engine</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Visualizing structural dependencies between organic chemistry concepts.</p>
        </div>
      </div>
      {/* Node Mocks */}
      <div className="absolute top-1/4 left-1/4 size-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <span className="text-[10px] font-black uppercase text-slate-400">Node A</span>
      </div>
      <div className="absolute bottom-1/3 right-1/4 size-16 bg-primary text-white rounded-lg shadow-lg flex items-center justify-center animate-bounce">
         <span className="text-[10px] font-black uppercase">Active</span>
      </div>
    </Card>
  );
};
