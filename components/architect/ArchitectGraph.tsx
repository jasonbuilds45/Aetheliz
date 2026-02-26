"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stabilityMap, setStabilityMap] = useState<
    Record<string, StabilityType>
  >({});

  /* -------------------------------------------------- */
  /* 1️⃣ Fetch Stability */
  /* -------------------------------------------------- */

  useEffect(() => {
    async function fetchStability() {
      if (!nodes.length) return;

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

    fetchStability();
  }, [nodes]);

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

    nodes.forEach((node) => {
      result[node.id] =
        stabilityMap[node.id]?.stability_state || "fragile";
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

    nodes.forEach((node) => {
      if (result[node.id] === "broken") {
        propagateDown(node.id);
      }
    });

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

  function getColorClasses(nodeId: string) {
    const state = propagatedState[nodeId];
    const confidence = stabilityMap[nodeId]?.confidence_score || 0;

    if (state === "stable") {
      return "bg-emerald-50 border-emerald-400";
    }

    if (state === "broken") {
      return "bg-rose-50 border-rose-400";
    }

    return confidence > 0.6
      ? "bg-amber-50 border-amber-300"
      : "bg-orange-50 border-orange-400";
  }

  /* -------------------------------------------------- */
  /* 6️⃣ Render */
  /* -------------------------------------------------- */

  return (
    <div className="space-y-16">

      {Object.keys(grouped)
        .sort((a, b) => Number(a) - Number(b))
        .map((lvlStr) => {
          const lvl = Number(lvlStr);

          return (
            <div key={lvl} className="text-center space-y-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Level {lvl}
              </p>

              {grouped[lvl].map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className={`${getColorClasses(node.id)} border rounded-xl px-6 py-4 max-w-xl mx-auto shadow-sm cursor-pointer transition`}
                >
                  <h3 className="font-semibold text-slate-900">
                    {node.name}
                  </h3>
                </div>
              ))}
            </div>
          );
        })}

      {selectedNode && (
        <div className="mt-12 p-6 bg-slate-50 rounded-xl border">
          <h2 className="text-xl font-bold">{selectedNode.name}</h2>
          <p className="mt-4 text-sm text-slate-600">
            {selectedNode.description}
          </p>

          {selectedNode.inclusion_reasoning && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-indigo-600 font-bold">
                Inclusion Reasoning
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedNode.inclusion_reasoning}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}