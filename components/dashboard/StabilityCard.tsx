
import React from 'react';
import { Card } from '../ui/Card';

interface StabilityCardProps {
  title: string;
  score: number;
  trend: string;
  isUp: boolean;
}

export const StabilityCard: React.FC<StabilityCardProps> = ({ title, score, trend, isUp }) => (
  <Card className="relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <span className="material-symbols-outlined text-6xl">shield_with_heart</span>
    </div>
    <div className="relative z-10">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-end gap-2">
        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{score}%</h3>
        <div className={`flex items-center text-xs font-bold pb-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          <span className="material-symbols-outlined text-sm">{isUp ? 'trending_up' : 'trending_down'}</span>
          {trend}
        </div>
      </div>
      <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${score > 70 ? 'bg-emerald-500' : score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  </Card>
);
