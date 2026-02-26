"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const supabase = createClientComponentClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stabilityMap, setStabilityMap] = useState<
    Record<string, StabilityType>
  >({});

  /* -------------------------------------------------- */
  /* 1️⃣ Fetch Stability From DB */
  /* -------------------------------------------------- */

  useEffect(() => {
    async function fetchStability() {
      const { data, error } = await supabase
        .from("architect_stability")
        .select("node_id, stability_state, confidence_score")
        .in(
          "node_id",
          nodes.map((n) => n.id)
        );

      if (!error && data) {
        const map: Record<string, StabilityType> = {};
        data.forEach((row) => {
          map[row.node_id] = row;
        });
        setStabilityMap(map);
      }
    }

    if (nodes.length) {
      fetchStability();
    }
  }, [nodes, supabase]);

  /* -------------------------------------------------- */
  /* 2️⃣ Build Adjacency Maps */
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
  /* 3️⃣ Compute Structural Levels */
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
  /* 4️⃣ Fragility Propagation */
  /* -------------------------------------------------- */

  const propagatedState = useMemo(() => {
    const result: Record<string, "stable" | "fragile" | "broken"> = {};

    // Start with base states
    nodes.forEach((node) => {
      result[node.id] =
        stabilityMap[node.id]?.stability_state || "fragile";
    });

    // If a node is broken → all downstream become fragile (if not broken)
    nodes.forEach((node) => {
      if (result[node.id] === "broken") {
        propagateDown(node.id);
      }
    });

    function propagateDown(id: string) {
      const dependents = dependentMap[id] || [];
      dependents.forEach((dep) => {
        if (result[dep] !== "broken") {
          result[dep] = "fragile";
        }
        propagateDown(dep);
      });
    }

    return result;
  }, [nodes, stabilityMap, dependentMap]);

  /* -------------------------------------------------- */
  /* 5️⃣ Group By Level */
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

  const selectedNode = nodes.find((n) => n.id === selectedId);

  /* -------------------------------------------------- */
  /* 6️⃣ UI Coloring Logic */
  /* -------------------------------------------------- */

  function getColorClasses(nodeId: string) {
    const state = propagatedState[nodeId];
    const confidence = stabilityMap[nodeId]?.confidence_score || 0;

    if (state === "stable") {
      return "bg-emerald-50 border-emerald-400";
    }

    if (state === "broken") {
      return "bg-rose-50 border-rose-400";
    }

    // fragile
    return confidence > 0.6
      ? "bg-amber-50 border-amber-300"
      : "bg-orange-50 border-orange-400";
  }

  /* -------------------------------------------------- */
  /* 7️⃣ Render */
  /* -------------------------------------------------- */

  return (
    <div className="grid lg:grid-cols-3 gap-12">

      {/* Blueprint Column */}
      <div className="lg:col-span-2 space-y-16">

        {Object.keys(grouped)
          .sort((a, b) => Number(a) - Number(b))
          .map((lvlStr) => {
            const lvl = Number(lvlStr);

            return (
              <div key={lvl} className="text-center">

                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Level {lvl}
                  </p>
                  <div className="mt-2 h-px bg-indigo-100 w-24 mx-auto" />
                </div>

                <div className="space-y-6">
                  {grouped[lvl].map((node) => {
                    const isSelected = node.id === selectedId;
                    const color = getColorClasses(node.id);

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedId(node.id)}
                        className={`${color} ${
                          isSelected ? "ring-2 ring-indigo-400" : ""
                        } border rounded-2xl px-8 py-6 max-w-xl mx-auto shadow-sm cursor-pointer transition`}
                      >
                        <h3 className="font-semibold text-slate-900">
                          {node.name}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

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
                {selectedNode.description}
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