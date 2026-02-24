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

  const levelMap = useMemo(() => {
    const map: Record<string, number> = {};
    function getLevel(id: string): number {
      if (map[id] !== undefined) return map[id];
      const node = nodes.find((n) => n.id === id);
      if (!node || !node.prerequisites?.length) {
        map[id] = 0;
        return 0;
      }
      const level = 1 + Math.max(...node.prerequisites.map((p) => getLevel(p)));
      map[id] = level;
      return level;
    }
    nodes.forEach((node) => getLevel(node.id));
    return map;
  }, [nodes]);

  const grouped = useMemo(() => {
    const groups: Record<number, NodeType[]> = {};
    nodes.forEach((node) => {
      const lvl = levelMap[node.id];
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(node);
    });
    return groups;
  }, [nodes, levelMap]);

  const stageLabels = ["Foundation", "Core Structure", "Applied Understanding", "Advanced Extension"];

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

  return (
    <div className="grid lg:grid-cols-3 gap-16 max-w-7xl mx-auto p-8 font-sans antialiased text-slate-800">
      
      {/* Blueprint Column */}
      <div className="lg:col-span-2 space-y-12">
        {Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map((lvlStr, index) => {
          const lvl = Number(lvlStr);
          const stageTitle = stageLabels[index] || `Stage ${index + 1}`;

          return (
            <div key={lvl} className="relative">
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                  {stageTitle}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grouped[lvl].map((node) => {
                  const isSelected = node.id === selectedId;
                  const isUpstream = upstream.has(node.id);
                  const isDownstream = downstream.has(node.id);

                  const baseClasses = "group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md";
                  let stateClasses = "bg-white border-slate-200 hover:border-indigo-200";

                  if (isSelected) stateClasses = "bg-indigo-50 border-indigo-500 shadow-indigo-100";
                  else if (isUpstream) stateClasses = "bg-emerald-50 border-emerald-200";
                  else if (isDownstream) stateClasses = "bg-amber-50 border-amber-200";

                  return (
                    <div key={node.id} onClick={() => setSelectedId(node.id)} className={`${baseClasses} ${stateClasses}`}>
                      <h3 className="font-semibold text-slate-700">{node.name}</h3>
                    </div>
                  );
                })}
              </div>

              {index < Object.keys(grouped).length - 1 && (
                <div className="my-8 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <span className="text-lg">↓</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Panel */}
      <aside className="sticky top-8 lg:h-[calc(100vh-4rem)]">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-full overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-8">
              <header>
                <h2 className="text-2xl font-bold text-slate-900">{selectedNode.name}</h2>
                <p className="text-slate-500 mt-3 leading-relaxed">{selectedNode.description || "No description provided for this module."}</p>
              </header>

              <div className="space-y-6">
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-3">Prerequisites</h4>
                  {selectedNode.prerequisites?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.prerequisites.map((p) => (
                        <span key={p} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100">
                          {nodes.find((n) => n.id === p)?.name}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">Foundation level module.</p>}
                </section>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button
                  onClick={onTest}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <p>Select a module to view its details and prerequisites.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}