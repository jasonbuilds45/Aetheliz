"use client";

import React, { useMemo, useState } from "react";

type NodeType = {
  id: string;
  name: string;
  description?: string;
  prerequisites?: string[];
};

export default function ArchitectGraph({
  nodes,
  onTest,
}: {
  nodes: NodeType[];
  onTest?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* -------------------------------------------------- */
  /* 1️⃣ Compute Structural Levels */
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
  /* 2️⃣ Group By Stage */
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
  /* 3️⃣ Relationship Detection */
  /* -------------------------------------------------- */

  const upstream = useMemo(() => {
    if (!selectedId) return new Set<string>();
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

    dfs(selectedId);
    return visited;
  }, [selectedId, nodes]);

  const downstream = useMemo(() => {
    if (!selectedId) return new Set<string>();
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

    dfs(selectedId);
    return visited;
  }, [selectedId, nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedId);

  /* -------------------------------------------------- */
  /* 4️⃣ Render Blueprint */
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

                {/* Arrow Between Stages */}
                {index <
                  Object.keys(grouped).length - 1 && (
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
                  "This module forms a structural component within the overall curriculum blueprint."}
              </p>
            </div>

            <div className="pt-6 border-t border-indigo-100">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Why It Depends on Others
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                This concept builds directly upon its prerequisite modules.
                Weak foundational understanding will propagate upward and
                reduce conceptual stability at this level.
              </p>
            </div>

            <div className="pt-6 border-t border-indigo-100">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                What It Enables
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Once mastered, this module unlocks more advanced structural
                reasoning in subsequent curriculum layers.
              </p>
            </div>

            <div className="pt-6 border-t border-indigo-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Direct Prerequisites
              </p>
              <div className="mt-3 space-y-2">
                {selectedNode.prerequisites?.length ? (
                  selectedNode.prerequisites.map((pre) => (
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