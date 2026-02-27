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
import {
  Info,
  Activity,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";

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

  /* ---------------- Fetch Stability ---------------- */

  useEffect(() => {
    async function fetchStability() {
      const { data } = await supabase
        .from("architect_stability")
        .select("node_id, stability_state, confidence_score")
        .in("node_id", nodes.map((n) => n.id));

      if (data) {
        const map: Record<string, StabilityType> = {};
        data.forEach((row) => (map[row.node_id] = row));
        setStabilityMap(map);
      }
    }

    if (nodes.length) fetchStability();
  }, [nodes]);

  /* ---------------- Propagation ---------------- */

  const propagatedState = useMemo(() => {
    const result: Record<string, "stable" | "fragile" | "broken"> = {};
    nodes.forEach((n) => {
      result[n.id] = stabilityMap[n.id]?.stability_state || "fragile";
    });

    function propagateDown(id: string) {
      edges
        .filter((e) => e.prerequisite_id === id)
        .forEach((edge) => {
          if (result[edge.dependent_id] !== "broken")
            result[edge.dependent_id] = "fragile";
          propagateDown(edge.dependent_id);
        });
    }

    nodes.forEach((n) => {
      if (result[n.id] === "broken") propagateDown(n.id);
    });

    return result;
  }, [nodes, edges, stabilityMap]);

  /* ---------------- Constellation Layout ---------------- */

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node, index) => {
      const state = propagatedState[node.id];

      const colorMap = {
        stable: {
          glow: "shadow-[0_0_25px_rgba(16,185,129,0.6)]",
          border: "border-emerald-400",
          text: "text-emerald-300",
          bg: "bg-emerald-500/10",
          icon: <CheckCircle2 size={14} />,
        },
        fragile: {
          glow: "shadow-[0_0_25px_rgba(245,158,11,0.6)]",
          border: "border-amber-400",
          text: "text-amber-300",
          bg: "bg-amber-500/10",
          icon: <Activity size={14} />,
        },
        broken: {
          glow: "shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse",
          border: "border-rose-500",
          text: "text-rose-300",
          bg: "bg-rose-500/10",
          icon: <AlertCircle size={14} />,
        },
      }[state];

      return {
        id: node.id,
        position: {
          x: Math.cos(index) * 300 + 400,
          y: Math.sin(index * 1.3) * 250 + 300,
        },
        data: {
          label: (
            <div
              onClick={() => setSelectedNode(node)}
              className={`px-6 py-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-105 ${colorMap.bg} ${colorMap.border} ${colorMap.glow}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${colorMap.text}`}>
                  {state}
                </span>
                <span className={colorMap.text}>{colorMap.icon}</span>
              </div>
              <p className="text-sm font-bold text-white">{node.name}</p>
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
      type: "smoothstep",
      animated: propagatedState[edge.prerequisite_id] === "broken",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#64748b",
      },
      style: {
        stroke: "#475569",
        strokeWidth: 1.5,
        opacity: 0.7,
      },
    }));
  }, [edges, propagatedState]);

  /* ---------------- Render ---------------- */

  return (
    <div className="grid grid-cols-4 gap-6 h-[750px] bg-[#0f172a] rounded-3xl overflow-hidden">

      {/* Graph */}
      <div className="col-span-3 relative">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1}
            color="#1e293b"
          />
          <Controls className="bg-slate-800 border-slate-700 text-white" />
          <MiniMap
            nodeStrokeWidth={3}
            maskColor="rgba(15,23,42,0.6)"
            nodeColor="#64748b"
          />
        </ReactFlow>
      </div>

      {/* Info Panel */}
      <aside className="bg-slate-900 border-l border-slate-800 text-white flex flex-col">
        {selectedNode ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <Info size={18} className="text-indigo-400" />
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Node Intelligence
              </span>
            </div>

            <h2 className="text-xl font-black mb-4">
              {selectedNode.name}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {selectedNode.description || "No description available."}
            </p>

            {selectedNode.inclusion_reasoning && (
              <>
                <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">
                  Structural Reasoning
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {selectedNode.inclusion_reasoning}
                </p>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800">
              <button
                onClick={onTest}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-bold transition-all"
              >
                <Zap size={16} className="inline mr-2" />
                Diagnose Concept
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <Activity size={32} className="mb-4 opacity-40" />
            <h3 className="text-sm font-bold text-white">Constellation Active</h3>
            <p className="text-xs mt-2 leading-relaxed">
              Select any node to explore its structural and cognitive role.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}