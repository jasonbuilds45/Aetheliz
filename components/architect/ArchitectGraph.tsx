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
import { Info, Activity, AlertCircle, CheckCircle2, Zap, Layers } from "lucide-react";

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

  /* ── 1. Calculate Hierarchical Layout to prevent overlaps ── */
  const flowNodes: Node[] = useMemo(() => {
    const levels: Record<string, number> = {};
    
    // Calculate depth for each node
    const getDepth = (id: string, visited = new Set()): number => {
      if (visited.has(id)) return 0;
      visited.add(id);
      const pres = edges.filter(e => e.dependent_id === id);
      if (pres.length === 0) return 0;
      return 1 + Math.max(...pres.map(p => getDepth(p.prerequisite_id, visited)));
    };

    nodes.forEach(n => { levels[n.id] = getDepth(n.id); });

    // Group nodes by level for horizontal spacing
    const levelCounts: Record<number, number> = {};
    
    return nodes.map((node) => {
      const state = propagatedState[node.id];
      const level = levels[node.id];
      const indexInLevel = levelCounts[level] || 0;
      levelCounts[level] = indexInLevel + 1;

      const styles = {
        stable: { bg: "bg-emerald-50", border: "border-emerald-500", text: "text-emerald-700", icon: <CheckCircle2 size={14} /> },
        fragile: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", icon: <Activity size={14} /> },
        broken: { bg: "bg-rose-50", border: "border-rose-500", text: "text-rose-700", icon: <AlertCircle size={14} /> },
      }[state];

      return {
        id: node.id,
        // Y-axis based on level (Foundation at bottom, Advanced at top)
        // X-axis spread based on number of nodes in that specific level
        position: {
          x: indexInLevel * 250, 
          y: 500 - (level * 200),
        },
        data: {
          label: (
            <div
              className={`flex flex-col gap-1 px-5 py-3 rounded-2xl border-2 shadow-sm transition-all hover:scale-105 cursor-pointer min-w-[200px] ${styles.bg} ${styles.border}`}
              onClick={() => setSelectedNode(node)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${styles.text}`}>
                  {state}
                </span>
                <span className={styles.text}>{styles.icon}</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{node.name}</p>
            </div>
          ),
        },
      };
    });
  }, [nodes, edges, propagatedState]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id || `${edge.prerequisite_id}-${edge.dependent_id}`,
      source: edge.prerequisite_id,
      target: edge.dependent_id,
      animated: propagatedState[edge.prerequisite_id] === "broken",
      type: 'smoothstep', // Cleaner look for blueprints
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style: { stroke: "#cbd5e1", strokeWidth: 2 },
    }));
  }, [edges, propagatedState]);

  return (
    <div className="grid grid-cols-4 gap-6 h-[750px] bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
      <div className="col-span-3 relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
             <Layers size={14} className="text-indigo-600" />
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Structural Blueprint</span>
          </div>
        </div>

        <ReactFlow nodes={flowNodes} edges={flowEdges} fitView padding={0.2}>
          <Background color="#e2e8f0" variant={BackgroundVariant.Dots} gap={24} />
          <Controls className="bg-white border-slate-200 shadow-sm rounded-lg" />
          <MiniMap nodeStrokeWidth={3} maskColor="rgba(241, 245, 249, 0.4)" />
        </ReactFlow>
      </div>

      <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        {selectedNode ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Info size={18} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Component Detail</span>
            </div>

            <h2 className="text-xl font-black text-slate-900 leading-tight mb-4">{selectedNode.name}</h2>

            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                  "{selectedNode.description || "No description provided for this node."}"
                </p>
              </div>

              {selectedNode.inclusion_reasoning && (
                <div>
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Diagnostic Reasoning</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedNode.inclusion_reasoning}</p>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <button onClick={onTest} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                <Zap size={16} fill="currentColor" />
                Diagnose Concept
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Activity size={32} className="text-slate-200 mb-4" />
            <h3 className="text-sm font-bold text-slate-900">Blueprint Active</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Select any node in the structural hierarchy to view its technical specifications and prerequisites.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}