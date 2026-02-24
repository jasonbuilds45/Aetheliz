'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

type ClassOverview = {
  class_name: string;
  average_stability: number;
  total_students: number;
  active_sessions: number;
};

type WeakConcept = {
  node_name: string;
  average_score: number;
};

type AtRiskStudent = {
  student_name: string;
  stability_score: number;
};

export default function TeacherDashboard() {
  const router = useRouter();

  const [overview, setOverview] = useState<ClassOverview | null>(null);
  const [weakConcepts, setWeakConcepts] = useState<WeakConcept[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/b2b/teacher-overview');
      const data = await res.json();

      setOverview(data.overview);
      setWeakConcepts(data.weak_concepts || []);
      setAtRisk(data.at_risk_students || []);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <p className="text-slate-500 text-sm">
          Loading classroom intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Classroom Oversight
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Structural insight across your active class.
          </p>
        </div>

        <button
          onClick={() => router.push('/b2b/teacher/launch')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Launch Diagnostic
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Class Stability Index"
          value={`${Math.round((overview?.average_stability || 0) * 100)}%`}
        />
        <MetricCard
          title="Total Students"
          value={overview?.total_students || 0}
        />
        <MetricCard
          title="Active Diagnostics"
          value={overview?.active_sessions || 0}
        />
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Weak Concepts */}
        <Card className="md:col-span-2 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">
            Most Fragile Concepts
          </h3>

          {weakConcepts.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No fragility data yet.
            </p>
          ) : (
            <div className="space-y-3">
              {weakConcepts.map((c) => (
                <div
                  key={c.node_name}
                  className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {c.node_name}
                  </span>
                  <span className="text-sm font-semibold text-rose-600">
                    {Math.round(c.average_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* At Risk Students */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">
            Students Needing Attention
          </h3>

          {atRisk.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No students flagged.
            </p>
          ) : (
            <div className="space-y-3">
              {atRisk.map((s) => (
                <div
                  key={s.student_name}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-slate-700">
                    {s.student_name}
                  </span>
                  <span className="text-sm font-semibold text-rose-600">
                    {Math.round(s.stability_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

/* Metric Card */
function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Card className="p-6 space-y-2">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <p className="text-3xl font-bold text-indigo-600">
        {value}
      </p>
    </Card>
  );
}