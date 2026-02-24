"use client"

import React, { useMemo } from "react"
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge
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

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node, index) => ({
      id: node.id,
      data: { label: node.name },
      position: {
        x: 250 * index,
        y: (node.prerequisites?.length || 0) * 120
      },
      style: {
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "10px",
        background: "#ffffff"
      }
    }))
  }, [nodes])

  const flowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = []

    nodes.forEach((node) => {
      node.prerequisites?.forEach((pre) => {
        edges.push({
          id: `${pre}-${node.id}`,
          source: pre,
          target: node.id
        })
      })
    })

    return edges
  }, [nodes])

  return (
    <div className="h-[500px] bg-slate-50 border border-slate-200 rounded-lg">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}