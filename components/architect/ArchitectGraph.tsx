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
  nodes,
  edges,
  onTest,
}: {
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

  // 1. Calculate the rank (column) for each node to prevent overlapping
  const nodeRanks = useMemo(() => {
    const ranks: Record<string, number> = {};
    const visited = new Set();

    const getRank = (id: string): number => {
      if (ranks[id] !== undefined) return ranks[id];
      
      const prerequisites = edges.filter(e => e.dependent_id === id);
      if (prerequisites.length === 0) return 0;
      
      const prereqRanks = prerequisites.map(p => getRank(p.prerequisite_id));
      return Math.max(...prereqRanks) + 1;
    };

    nodes.forEach(node => { ranks[node.id] = getRank(node.id); });
    return ranks;
  }, [nodes, edges]);

  // 2. Propagate stability states
  const propagatedState = useMemo(() => {
    const result: Record<string, "stable" | "fragile" | "broken"> = {};
    nodes.forEach((node) => {
      result[node.id] = stabilityMap[node.id]?.stability_state || "fragile";
    });

    const propagateDown = (id: string) => {
      edges.filter((e) => e.prerequisite_id === id).forEach((edge) => {
        if (result[edge.dependent_id] !== "broken") result[edge.dependent_id] = "fragile";
        propagateDown(edge.dependent_id);
      });
    };

    nodes.forEach((node) => {
      if (result[node.id] === "broken") propagateDown(node.id);
    });
    return result;
  }, [nodes, edges, stabilityMap]);

  // 3. Render neat, non-overlapping nodes
  const flowNodes: Node[] = useMemo(() => {
    const rankCounts: Record<number, number> = {};

    return nodes.map((node) => {
      const state = propagatedState[node.id];
      const rank = nodeRanks[node.id] || 0;
      
      // Track how many nodes are in this column to offset them vertically
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;

      const styles = {
        stable: { bg: "bg-emerald-50", border: "border-emerald-500", text: "text-emerald-700", icon: <CheckCircle2 size={14} /> },
        fragile: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", icon: <Activity size={14} /> },
        broken: { bg: "bg-rose-50", border: "border-rose-500", text: "text-rose-700", icon: <AlertCircle size={14} /> },
      }[state];

      return {
        id: node.id,
        // Column (X) based on rank, Row (Y) based on count in that column
        position: { x: rank * 300, y: (rankCounts[rank] - 1) * 120 },
        data: {
          label: (
            <div
              className={`flex flex-col gap-1 px-5 py-4 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md cursor-pointer w-[240px] ${styles.bg} ${styles.border}`}
              onClick={() => setSelectedNode(node)}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${styles.text}`}>
                  {state}
                </span>
                <span className={styles.text}>{styles.icon}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 line-clamp-2">
                {node.name}
              </p>
            </div>
          ),
        },
      };
    });
  }, [nodes, nodeRanks, propagatedState]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id || `${edge.prerequisite_id}-${edge.dependent_id}`,
      source: edge.prerequisite_id,
      target: edge.dependent_id,
      animated: propagatedState[edge.prerequisite_id] === "broken",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 20, height: 20 },
      style: { stroke: "#cbd5e1", strokeWidth: 2 },
    }));
  }, [edges, propagatedState]);

  return (
    <div className="grid grid-cols-4 gap-6 h-[700px] bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
      <div className="col-span-3 relative bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden">
        <ReactFlow nodes={flowNodes} edges={flowEdges} fitView minZoom={0.2}>
          <Background color="#cbd5e1" variant={BackgroundVariant.Lines} gap={40} size={1} />
          <Controls className="bg-white border-slate-200 rounded-lg shadow-xl" />
          <MiniMap nodeBorderRadius={12} />
        </ReactFlow>
      </div>

      <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {selectedNode ? (
          <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="text-indigo-600 w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Structural Component</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-6">{selectedNode.name}</h2>
            <div className="space-y-8">
              <section>
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Diagnostic Summary</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedNode.description}</p>
              </section>
              {selectedNode.inclusion_reasoning && (
                <section>
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Blueprint Logic</h4>
                  <p className="text-sm text-slate-500 italic leading-relaxed">{selectedNode.inclusion_reasoning}</p>
                </section>
              )}
            </div>
            <div className="mt-auto pt-8">
              <button onClick={onTest} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                <Zap size={16} fill="currentColor" /> Analyze Stability
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-dashed border-slate-200">
              <Activity size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Blueprint Ready</h3>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">Select any node to begin structural analysis.</p>
          </div>
        )}
      </aside>
    </div>
  );
}