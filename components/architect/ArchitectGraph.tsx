"use client"

import React, { useMemo, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType
} from "reactflow"
import "reactflow/dist/style.css"

type NodeType = {
  id: string
  name: string
  description?: string
  prerequisites?: string[]
}

export default function ArchitectGraph({
  nodes
}: {
  nodes: NodeType[]
}) {
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null)

  // -------- Compute Depth Levels --------
  const levelMap = useMemo(() => {
    const map: Record<string, number> = {}

    function getLevel(id: string): number {
      const node = nodes.find(n => n.id === id)
      if (!node || !node.prerequisites?.length) return 0
      return 1 + Math.max(...node.prerequisites.map(p => getLevel(p)))
    }

    nodes.forEach(node => {
      map[node.id] = getLevel(node.id)
    })

    return map
  }, [nodes])

  const flowNodes: Node[] = useMemo(() => {
    const spacingX = 220
    const spacingY = 140

    return nodes.map((node, index) => ({
      id: node.id,
      data: { label: node.name },
      position: {
        x: index * spacingX,
        y: levelMap[node.id] * spacingY
      },
      style: {
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "10px",
        background: "#ffffff",
        fontSize: "13px"
      }
    }))
  }, [nodes, levelMap])

  const flowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []

    nodes.forEach(node => {
      node.prerequisites?.forEach(pre => {
        edges.push({
          id: `${pre}-${node.id}`,
          source: pre,
          target: node.id,
          markerEnd: {
            type: MarkerType.ArrowClosed
          },
          style: { stroke: "#64748b" }
        })
      })
    })

    return edges
  }, [nodes])

  const handleNodeClick = (_: any, node: Node) => {
    const fullNode = nodes.find(n => n.id === node.id)
    if (fullNode) setSelectedNode(fullNode)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">

      {/* Graph */}
      <div className="lg:col-span-2 h-[500px] bg-slate-50 border border-slate-200 rounded-lg">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          onNodeClick={handleNodeClick}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Info Panel */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm space-y-4">
        {selectedNode ? (
          <>
            <div>
              <h3 className="font-semibold text-slate-800">
                {selectedNode.name}
              </h3>
              <p className="text-slate-500 mt-2">
                {selectedNode.description}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Depends On
              </p>
              {selectedNode.prerequisites?.length ? (
                <ul className="mt-2 space-y-1 text-slate-700">
                  {selectedNode.prerequisites.map(pre => {
                    const preNode = nodes.find(n => n.id === pre)
                    return (
                      <li key={pre}>
                        • {preNode?.name}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-slate-500">
                  Foundational concept (no prerequisites)
                </p>
              )}
            </div>

            {selectedNode.prerequisites?.length ? (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-md">
                <p className="text-xs font-semibold text-indigo-600 uppercase">
                  Dependency Insight
                </p>
                <p className="text-xs text-indigo-700 mt-1">
                  Understanding {selectedNode.name} requires
                  mastery of its prerequisite concepts.
                  Gaps in those areas will directly
                  affect performance here.
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-slate-500">
            Select a node to view details.
          </p>
        )}
      </div>

    </div>
  )
}