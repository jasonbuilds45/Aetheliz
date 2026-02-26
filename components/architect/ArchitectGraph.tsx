"use client";

import React, { useMemo, useState } from "react";

type NodeType = {
  id: string;
  name: string;
  description?: string;
  inclusion_reasoning?: string;
  level?: number;
};

type EdgeType = {
  id?: string;
  prerequisite_id: string;
  dependent_id: string;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* -------------------------------------------------- */
  /* 1️⃣ Build Adjacency Maps From Edges */
  /* -------------------------------------------------- */

  const { prereqMap, dependentMap } = useMemo(() => {
    const prereq: Record<string, string[]> = {};
    const dependent: Record<string, string[]> = {};

    nodes.forEach((n) => {
      prereq[n.id] = [];
      dependent[n.id] = [];
    });

    edges.forEach((e) => {
      prereq[e.dependent_id]?.push(e.prerequisite_id);
      dependent[e.prerequisite_id]?.push(e.dependent_id);
    });

    return { prereqMap: prereq, dependentMap: dependent };
  }, [nodes, edges]);

  /* -------------------------------------------------- */
  /* 2️⃣ Compute Structural Levels (True DAG Logic) */
  /* -------------------------------------------------- */

  const levelMap = useMemo(() => {
    const levels: Record<string, number> = {};

    function computeLevel(id: string): number {
      if (levels[id] !== undefined) return levels[id];

      const prereqs = prereqMap[id] || [];

      if (!prereqs.length) {
        levels[id] = 0;
        return 0;
      }

      const lvl = 1 + Math.max(...prereqs.map(computeLevel));
      levels[id] = lvl;
      return lvl;
    }

    nodes.forEach((n) => computeLevel(n.id));
    return levels;
  }, [nodes, prereqMap]);

  /* -------------------------------------------------- */
  /* 3️⃣ Group By Level */
  /* -------------------------------------------------- */

  const grouped = useMemo(() => {
    const groups: Record<number, NodeType[]> = {};

    nodes.forEach((node) => {
      const lvl = levelMap[node.id];
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(node);
    });

    return groups;
  }, [nodes, levelMap]);

  const stageLabels = [
    "Foundation",
    "Core Structure",
    "Applied Understanding",
    "Advanced Extension",
  ];

  /* -------------------------------------------------- */
  /* 4️⃣ Relationship Highlighting */
  /* -------------------------------------------------- */

  const upstream = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const visited = new Set<string>();

    function dfs(id: string) {
      const prereqs = prereqMap[id] || [];
      prereqs.forEach((p) => {
        if (!visited.has(p)) {
          visited.add(p);
          dfs(p);
        }
      });
    }

    dfs(selectedId);
    return visited;
  }, [selectedId, prereqMap]);

  const downstream = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const visited = new Set<string>();

    function dfs(id: string) {
      const dependents = dependentMap[id] || [];
      dependents.forEach((d) => {
        if (!visited.has(d)) {
          visited.add(d);
          dfs(d);
        }
      });
    }

    dfs(selectedId);
    return visited;
  }, [selectedId, dependentMap]);

  const selectedNode = nodes.find((n) => n.id === selectedId);

  /* -------------------------------------------------- */
  /* 5️⃣ Render */
  /* -------------------------------------------------- */

  return (
    <div className="grid lg:grid-cols-3 gap-12">

      {/* Blueprint Column */}
      <div className="lg:col-span-2 space-y-16">

        {Object.keys(grouped)
          .sort((a, b) => Number(a) - Number(b))
          .map((lvlStr, index) => {
            const lvl = Number(lvlStr);
            const stageTitle =
              stageLabels[index] || `Stage ${index + 1}`;

            return (
              <div key={lvl} className="text-center">

                {/* Stage Label */}
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    {stageTitle}
                  </p>
                  <div className="mt-2 h-px bg-indigo-100 w-24 mx-auto" />
                </div>

                {/* Nodes */}
                <div className="space-y-6">
                  {grouped[lvl].map((node) => {
                    const isSelected = node.id === selectedId;
                    const isUpstream = upstream.has(node.id);
                    const isDownstream = downstream.has(node.id);

                    let bg = "bg-white";
                    let border = "border-slate-200";

                    if (isSelected) {
                      bg = "bg-indigo-50";
                      border = "border-indigo-400";
                    } else if (isUpstream) {
                      bg = "bg-emerald-50";
                      border = "border-emerald-300";
                    } else if (isDownstream) {
                      bg = "bg-amber-50";
                      border = "border-amber-300";
                    }

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedId(node.id)}
                        className={`${bg} ${border} border rounded-2xl px-8 py-6 max-w-xl mx-auto shadow-sm cursor-pointer transition`}
                      >
                        <h3 className="font-semibold text-slate-900">
                          {node.name}
                        </h3>
                      </div>
                    );
                  })}
                </div>

                {/* Arrow Between Levels */}
                {index < Object.keys(grouped).length - 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex flex-col items-center text-indigo-400">
                      <div className="h-8 w-px bg-indigo-200" />
                      <div className="text-2xl">↓</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {/* CTA */}
        <div className="text-center pt-10">
          <button
            onClick={onTest}
            className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 transition"
          >
            Test This Blueprint
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-8 shadow-sm space-y-6">

        {selectedNode ? (
          <>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedNode.name}
              </h2>
              <p className="text-slate-600 mt-4 leading-relaxed">
                {selectedNode.description ||
                  "This module forms a structural component within the overall blueprint."}
              </p>
            </div>

            {selectedNode.inclusion_reasoning && (
              <div className="pt-6 border-t border-indigo-100">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Inclusion Reasoning
                </p>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {selectedNode.inclusion_reasoning}
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-indigo-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Direct Prerequisites
              </p>

              <div className="mt-3 space-y-2">
                {(prereqMap[selectedNode.id] || []).length ? (
                  prereqMap[selectedNode.id].map((pre) => (
                    <div
                      key={pre}
                      className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700"
                    >
                      {nodes.find((n) => n.id === pre)?.name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Foundational concept
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-center">
            Select a module to explore its structural role.
          </div>
        )}
      </div>
    </div>
  );
}