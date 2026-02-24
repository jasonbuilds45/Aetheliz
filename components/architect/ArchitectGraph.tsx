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

  const levelMap = useMemo(() => {
    const map: Record<string, number> = {};
    function getLevel(id: string): number {
      const node = nodes.find((n) => n.id === id);
      if (!node || !node.prerequisites?.length) return 0;
      return 1 + Math.max(...node.prerequisites.map((p) => getLevel(p)));
    }
    nodes.forEach((node) => {
      map[node.id] = getLevel(node.id);
    });
    return map;
  }, [nodes]);

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      data: { label: node.name },
      position: {
        x: (parseInt(node.id) || 0) * 200,
        y: levelMap[node.id] * 120,
      },
      style: {
        background: "#ffffff",
        border: selectedNodeId === node.id ? "2px solid #4f46e5" : "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px",
        fontWeight: "600",
        color: "#1e293b",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        cursor: "pointer",
        width: 160,
        textAlign: "center",
      },
    }));
  }, [nodes, levelMap, selectedNodeId]);

  const flowEdges: Edge[] = useMemo(() => {
    return nodes.flatMap((node) =>
      (node.prerequisites || []).map((pre) => ({
        id: `${pre}-${node.id}`,
        source: pre,
        target: node.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      }))
    );
  }, [nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="grid lg:grid-cols-3 gap-8 p-6 bg-slate-50 rounded-2xl">
      <div className="lg:col-span-2 h-[500px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls className="!bg-white !border-slate-200" />
        </ReactFlow>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {selectedNode ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{selectedNode.name}</h3>
              <p className="text-slate-600 mt-3 leading-relaxed">{selectedNode.description}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Dependencies</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedNode.prerequisites?.map((pre) => (
                  <span key={pre} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                    {nodes.find((n) => n.id === pre)?.name}
                  </span>
                )) || <p className="text-sm text-slate-400 italic">No prerequisites required.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            Select a learning module to see details.
          </div>
        )}
      </div>
    </div>
  );
}