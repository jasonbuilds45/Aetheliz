"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

type NodeType = {
  id: string;
  name: string;
  description?: string;
  prerequisites?: string[];
};

export default function ArchitectGraph({ nodes }: { nodes: NodeType[] }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  /* -------------------------------------------------- */
  /* 1️⃣ Compute Levels Properly */
  /* -------------------------------------------------- */

  const levelMap = useMemo(() => {
    const map: Record<string, number> = {};

    function getLevel(id: string): number {
      if (map[id] !== undefined) return map[id];
      const node = nodes.find((n) => n.id === id);
      if (!node || !node.prerequisites?.length) {
        map[id] = 0;
        return 0;
      }
      const level =
        1 + Math.max(...node.prerequisites.map((p) => getLevel(p)));
      map[id] = level;
      return level;
    }

    nodes.forEach((node) => getLevel(node.id));
    return map;
  }, [nodes]);

  /* -------------------------------------------------- */
  /* 2️⃣ Group Nodes by Level */
  /* -------------------------------------------------- */

  const levels = useMemo(() => {
    const grouped: Record<number, NodeType[]> = {};
    nodes.forEach((node) => {
      const lvl = levelMap[node.id];
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(node);
    });
    return grouped;
  }, [nodes, levelMap]);

  /* -------------------------------------------------- */
  /* 3️⃣ Determine Relationship Sets */
  /* -------------------------------------------------- */

  const upstream = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const visited = new Set<string>();

    function dfs(id: string) {
      const node = nodes.find((n) => n.id === id);
      node?.prerequisites?.forEach((p) => {
        if (!visited.has(p)) {
          visited.add(p);
          dfs(p);
        }
      });
    }

    dfs(selectedNodeId);
    return visited;
  }, [selectedNodeId, nodes]);

  const downstream = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const visited = new Set<string>();

    function dfs(id: string) {
      nodes.forEach((n) => {
        if (n.prerequisites?.includes(id)) {
          if (!visited.has(n.id)) {
            visited.add(n.id);
            dfs(n.id);
          }
        }
      });
    }

    dfs(selectedNodeId);
    return visited;
  }, [selectedNodeId, nodes]);

  /* -------------------------------------------------- */
  /* 4️⃣ Layout Proper Centered Grid */
  /* -------------------------------------------------- */

  const flowNodes: Node[] = useMemo(() => {
    const spacingX = 220;
    const spacingY = 160;

    const result: Node[] = [];

    Object.entries(levels).forEach(([lvlStr, nodesInLevel]) => {
      const lvl = Number(lvlStr);
      const totalWidth = nodesInLevel.length * spacingX;
      const startX = -totalWidth / 2;

      nodesInLevel.forEach((node, index) => {
        const isSelected = node.id === selectedNodeId;
        const isUpstream = upstream.has(node.id);
        const isDownstream = downstream.has(node.id);

        let borderColor = "#e2e8f0";
        let background = "#ffffff";

        if (isSelected) {
          borderColor = "#4f46e5";
          background = "#eef2ff";
        } else if (isUpstream) {
          borderColor = "#10b981";
          background = "#ecfdf5";
        } else if (isDownstream) {
          borderColor = "#f59e0b";
          background = "#fffbeb";
        }

        result.push({
          id: node.id,
          data: { label: node.name },
          position: {
            x: startX + index * spacingX,
            y: lvl * spacingY,
          },
          style: {
            background,
            border: `2px solid ${borderColor}`,
            borderRadius: "14px",
            padding: "16px",
            fontWeight: 600,
            color: "#1e293b",
            width: 180,
            textAlign: "center",
            boxShadow:
              "0 6px 16px -4px rgba(0,0,0,0.08)",
            cursor: "pointer",
          },
        });
      });
    });

    return result;
  }, [levels, selectedNodeId, upstream, downstream]);

  /* -------------------------------------------------- */
  /* 5️⃣ Edges */
  /* -------------------------------------------------- */

  const flowEdges: Edge[] = useMemo(() => {
    return nodes.flatMap((node) =>
      (node.prerequisites || []).map((pre) => ({
        id: `${pre}-${node.id}`,
        source: pre,
        target: node.id,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
        },
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      }))
    );
  }, [nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  /* -------------------------------------------------- */
  /* 6️⃣ Render */
  /* -------------------------------------------------- */

  return (
    <div className="grid lg:grid-cols-3 gap-8 p-8 bg-indigo-50 rounded-3xl">

      {/* Graph Area */}
      <div className="lg:col-span-2 h-[600px] bg-white border border-indigo-100 rounded-3xl shadow-sm overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        >
          <Background color="#e2e8f0" gap={24} />
          <Controls className="!bg-white !border-indigo-100" />
        </ReactFlow>
      </div>

      {/* Info Panel */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-8 shadow-sm space-y-6">
        {selectedNode ? (
          <>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {selectedNode.name}
              </h3>
              <p className="text-slate-600 mt-4 leading-relaxed">
                {selectedNode.description ||
                  "This module represents a structural component of the overall concept map."}
              </p>
            </div>

            {/* Dependency Explanation */}
            <div className="pt-6 border-t border-indigo-50">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Why This Depends on Others
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Mastery of this concept requires understanding its prerequisite
                modules. Structural gaps in upstream nodes will propagate here,
                affecting reasoning depth and accuracy.
              </p>
            </div>

            {/* Unlock Explanation */}
            <div className="pt-6 border-t border-indigo-50">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                What This Unlocks
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Once stabilized, this module enables progression into more
                advanced conceptual dependencies further down the structure.
              </p>
            </div>

            {/* Prerequisites List */}
            <div className="pt-6 border-t border-indigo-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Direct Prerequisites
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedNode.prerequisites?.length ? (
                  selectedNode.prerequisites.map((pre) => (
                    <span
                      key={pre}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"
                    >
                      {nodes.find((n) => n.id === pre)?.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400 italic">
                    Foundational concept
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-center">
            Select a module to explore its structural role within the concept map.
          </div>
        )}
      </div>
    </div>
  );
}