"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, BookOpen, ChevronRight } from "lucide-react";
import ArchitectGraph from "@/components/architect/ArchitectGraph";

type GraphData = {
  map_id: string;
  nodes: any[];
  edges: any[];
};

export default function ArchitectPage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [educationStage, setEducationStage] = useState("High School");
  const [graph, setGraph] = useState<GraphData | null>(null);
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
        body: JSON.stringify({
          topic,
          education_stage: educationStage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate blueprint");
      }

      setGraph({
        map_id: data.map_id,
        nodes: data.nodes,
        edges: data.edges,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Engine Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Sparkles className="text-indigo-600 w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-900">
            Concept Configuration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Target Topic
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Thermodynamics"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg h-12 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Education Stage
            </label>
            <select
              value={educationStage}
              onChange={(e) => setEducationStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg h-12 px-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option>Middle School</option>
              <option>High School</option>
              <option>Undergraduate</option>
            </select>
          </div>

          <button
            onClick={generateGraph}
            disabled={loading}
            className="bg-indigo-600 text-white h-12 px-8 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              "Generate Blueprint"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-xs text-rose-600 font-bold">{error}</p>
        )}
      </section>

      {/* Blueprint Display */}
      {graph && (
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-8 shadow-sm min-h-[500px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
              Structural Hierarchy
            </h3>

            <ArchitectGraph
              mapId={graph.map_id}
              nodes={graph.nodes}
              edges={graph.edges}
            />
          </div>

          <aside className="space-y-6">
            <div className="bg-indigo-900 border border-indigo-900 rounded-xl p-6 text-white shadow-lg">
              <BookOpen className="w-6 h-6 mb-4 text-indigo-300" />
              <h4 className="font-bold text-lg mb-2">Ready to Validate?</h4>
              <p className="text-indigo-200 text-xs leading-relaxed mb-6">
                Your blueprint is constructed. Proceed to the diagnostic phase
                to verify your structural understanding.
              </p>
              <button
                onClick={() =>
                  router.push(
                    `/b2c/diagnose?topic=${encodeURIComponent(topic)}`
                  )
                }
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                Test Blueprint <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}