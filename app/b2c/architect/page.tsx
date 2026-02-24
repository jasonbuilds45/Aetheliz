"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, GraduationCap, Loader2 } from "lucide-react";
import ArchitectGraph from "@/components/architect/ArchitectGraph";

type NodeType = {
  id: string;
  name: string;
  description?: string;
  prerequisites?: string[];
};

export default function ArchitectPage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [educationStage, setEducationStage] = useState("High School");
  const [graph, setGraph] = useState<NodeType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGraph = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, education_stage: educationStage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setGraph(data.graph);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Concept <span className="text-indigo-600">Architect</span>
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Map out complex topics into clear, bite-sized learning paths.
        </p>
      </div>

      {/* Input Section - Styled as a Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm shadow-slate-100">
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Quantum Physics"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Level</label>
            <select
              value={educationStage}
              onChange={(e) => setEducationStage(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition"
            >
              <option>Middle School</option>
              <option>High School</option>
              <option>Undergraduate</option>
            </select>
          </div>

          <button
            onClick={generateGraph}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-xl px-4 py-3 hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Building..." : "Architect"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
      </div>

      {/* Graph Section */}
      {graph && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="border border-indigo-100 rounded-3xl p-1 bg-indigo-50/50">
            <ArchitectGraph nodes={graph} />
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => router.push(`/b2c/diagnose?topic=${encodeURIComponent(topic)}`)}
              className="flex items-center gap-2 bg-emerald-600 text-white font-bold rounded-2xl px-8 py-4 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-5 h-5" />
              Test My Understanding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}