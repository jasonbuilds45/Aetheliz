"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { createClient } from "@supabase/supabase-js";

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
  const [stabilityMap, setStabilityMap] = useState<
    Record<string, StabilityType>
  >({});

  /* -------------------------------------------------- */
  /* 1️⃣ Fetch Stability */
  /* -------------------------------------------------- */

  useEffect(() => {
    async function fetchStability() {
      const { data } = await supabase
        .from("architect_stability")
        .select("node_id, stability_state, confidence_score")
        .in("node_id", nodes.map((n) => n.id));

      if (data) {
        const map: Record<string, StabilityType> = {};
        data.forEach((row) => {
          map[row.node_id] = row;
        });
        setStabilityMap(map);
      }
    }

    if (nodes.length) fetchStability();
  }, [nodes]);

  /* -------------------------------------------------- */
  /* 2️⃣ Stability Propagation */
  /* -------------------------------------------------- */

  const propagatedState = useMemo(() => {
    const result: Record<string, "stable" | "fragile" | "broken"> = {};

    nodes.forEach((node) => {
      result[node.id] =
        stabilityMap[node.id]?.stability_state || "fragile";
    });

    function propagateDown(id: string) {
      edges
        .filter((e) => e.prerequisite_id === id)
        .forEach((edge) => {
          if (result[edge.dependent_id] !== "broken") {
            result[edge.dependent_id] = "fragile";
          }
          propagateDown(edge.dependent_id);
        });
    }

    nodes.forEach((node) => {
      if (result[node.id] === "broken") {
        propagateDown(node.id);
      }
    });

    return result;
  }, [nodes, edges, stabilityMap]);

  /* -------------------------------------------------- */
  /* 3️⃣ Convert To ReactFlow Format */
  /* -------------------------------------------------- */

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node, index) => {
      const state = propagatedState[node.id];

      let background = "#fef3c7";
      let border = "#f59e0b";

      if (state === "stable") {
        background = "#ecfdf5";
        border = "#10b981";
      }

      if (state === "broken") {
        background = "#fef2f2";
        border = "#ef4444";
      }

      return {
        id: node.id,
        position: {
          x: Math.random() * 600,
          y: Math.random() * 400,
        },
        data: {
          label: (
            <div
              className="px-4 py-3 rounded-xl border shadow-sm text-sm font-semibold cursor-pointer"
              style={{
                background,
                borderColor: border,
                borderWidth: 2,
              }}
              onClick={() => setSelectedNode(node)}
            >
              {node.name}
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
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        strokeWidth: 2,
      },
    }));
  }, [edges]);

  /* -------------------------------------------------- */
  /* 4️⃣ Render */
  /* -------------------------------------------------- */

  return (
    <div className="grid grid-cols-4 gap-8 h-[700px]">

      {/* Graph */}
      <div className="col-span-3 bg-white rounded-xl border shadow-sm">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Info Panel */}
      <div className="bg-white rounded-xl border p-6 shadow-sm overflow-y-auto">
        {selectedNode ? (
          <>
            <h2 className="text-lg font-bold">
              {selectedNode.name}
            </h2>

            <p className="mt-4 text-sm text-slate-600">
              {selectedNode.description}
            </p>

            {selectedNode.inclusion_reasoning && (
              <>
                <p className="mt-6 text-xs uppercase tracking-widest text-indigo-600 font-bold">
                  Inclusion Reasoning
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedNode.inclusion_reasoning}
                </p>
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Select a node to inspect its structural role.
          </p>
        )}
      </div>
    </div>
  );
}