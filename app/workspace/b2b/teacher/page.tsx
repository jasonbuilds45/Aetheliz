
import React from 'react';
import { Card } from '../../../../components/ui/Card';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Classroom Oversight</h1>
        <p className="text-slate-500 text-sm">Managing Section 12-A Performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <h3 className="font-bold mb-4">Active Diagnostic Sessions</h3>
          <div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
             <p className="text-slate-400 text-sm italic">No active sessions. Launch a probe to begin.</p>
          </div>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold mb-2">Upcoming Tasks</h3>
            <ul className="text-sm space-y-3">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="size-2 bg-primary rounded-full"></span>
                Review Algebra Results
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="size-2 bg-slate-200 rounded-full"></span>
                Prepare Week 4 Recalibration
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
