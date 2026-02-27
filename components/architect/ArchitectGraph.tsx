"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { createClient } from "@supabase/supabase-js";
import { Info, Activity, AlertCircle, CheckCircle2, Zap } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type NodeType = {
  id: string;
  name: string;
  description?: string;
  inclusion_reasoning?: string;
};

type EdgeType = {
  id?: string;
  prerequisite_id: string;
  dependent_id: string;
};

type StabilityType = {
  node_id: string;
  stability_state: "stable" | "fragile" | "broken";
  confidence_score: number;
};

export default function ArchitectGraph({
  mapId,
  nodes,
  edges,
  onTest,
}: {
  mapId: string;
  nodes: NodeType[];
  edges: EdgeType[];
  onTest?: () => void;
}) {
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [stabilityMap, setStabilityMap] = useState<Record<string, StabilityType>>({});

  useEffect(() => {
    async function fetchStability() {
      const { data } = await supabase
        .from("architect_stability")
        .select("node_id, stability_state, confidence_score")
        .in("node_id", nodes.map((n) => n.id));

      if (data) {
        const map: Record<string, StabilityType> = {};
        data.forEach((row) => { map[row.node_id] = row; });
        setStabilityMap(map);
      }
    }
    if (nodes.length) fetchStability();
  }, [nodes]);

  const propagatedState = useMemo(() => {
    const result: Record<string, "stable" | "fragile" | "broken"> = {};
    nodes.forEach((node) => {
      result[node.id] = stabilityMap[node.id]?.stability_state || "fragile";
    });

    function propagateDown(id: string) {
      edges
        .filter((e) => e.prerequisite_id === id)
        .forEach((edge) => {
          if (result[edge.dependent_id] !== "broken") result[edge.dependent_id] = "fragile";
          propagateDown(edge.dependent_id);
        });
    }

    nodes.forEach((node) => {
      if (result[node.id] === "broken") propagateDown(node.id);
    });
    return result;
  }, [nodes, edges, stabilityMap]);

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node, index) => {
      const state = propagatedState[node.id];

      // Professional Color Palette
      const styles = {
        stable: { bg: "bg-emerald-50", border: "border-emerald-500", text: "text-emerald-700", icon: <CheckCircle2 size={14} /> },
        fragile: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", icon: <Activity size={14} /> },
        broken: { bg: "bg-rose-50", border: "border-rose-500", text: "text-rose-700", icon: <AlertCircle size={14} /> },
      }[state];

      return {
        id: node.id,
        // Simple radial distribution to prevent overlap on load
        position: {
          x: 300 + Math.cos(index) * 250,
          y: 250 + Math.sin(index) * 200,
        },
        data: {
          label: (
            <div
              className={`group flex flex-col gap-1 px-5 py-3 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer min-w-[160px] ${styles.bg} ${styles.border}`}
              onClick={() => setSelectedNode(node)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${styles.text}`}>
                  {state}
                </span>
                <span className={styles.text}>{styles.icon}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {node.name}
              </p>
            </div>
          ),
        },
      };
    });
  }, [nodes, propagatedState]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id || `${edge.prerequisite_id}-${edge.dependent_id}`,
      source: edge.prerequisite_id,
      target: edge.dependent_id,
      animated: propagatedState[edge.prerequisite_id] === "broken",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style: { stroke: "#cbd5e1", strokeWidth: 2 },
    }));
  }, [edges, propagatedState]);

  return (
    <div className="grid grid-cols-4 gap-6 h-[750px] bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
      {/* ── Graph Area ── */}
      <div className="col-span-3 relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Stable</span>
          </div>
          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Broken</span>
          </div>
        </div>

        <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
          <Background color="#e2e8f0" variant={BackgroundVariant.Dots} gap={20} />
          <Controls className="bg-white border-slate-200 shadow-sm" />
          <MiniMap nodeStrokeWidth={3} maskColor="rgba(241, 245, 249, 0.6)" />
        </ReactFlow>
      </div>

      {/* ── Inspection Panel ── */}
      <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        {selectedNode ? (
          <div className="flex-1 flex flex-col p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Info size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Inspector</span>
            </div>

            <h2 className="text-xl font-black text-slate-900 leading-tight mb-4">
              {selectedNode.name}
            </h2>

            <div className="space-y-6">
              <section>
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Technical Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedNode.description || "No description available for this structural node."}
                </p>
              </section>

              {selectedNode.inclusion_reasoning && (
                <section>
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Structural Utility</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedNode.inclusion_reasoning}
                  </p>
                </section>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button 
                onClick={onTest}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
              >
                <Zap size={16} fill="currentColor" />
                Diagnose Node
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
              <Activity size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Blueprint Explorer</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Select a concept node from the graph to analyze its structural integrity and prerequisites.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}