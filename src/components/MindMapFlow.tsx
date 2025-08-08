'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { MindMapNode as CustomMindMapNode } from '@/types';
import { CustomNode } from './CustomNode';

interface MindMapFlowProps {
  nodes: CustomMindMapNode[];
  onNodeClick: (node: CustomMindMapNode) => void;
  isLoading: boolean;
}

const nodeTypes = {
  custom: CustomNode,
};

export const MindMapFlow: React.FC<MindMapFlowProps> = ({
  nodes: mindMapNodes,
  onNodeClick,
}) => {
  // Convert mindmap nodes to ReactFlow nodes
  const reactFlowNodes: Node[] = useMemo(
    () =>
      mindMapNodes.map((node) => ({
        id: node.id,
        type: 'custom',
        position: { x: node.x, y: node.y },
        data: {
          label: node.label,
          description: node.description,
          level: node.level,
          color: node.color,
          onClick: () => onNodeClick(node),
          node: node,
        },
        draggable: true,
        selectable: true,
      })),
    [mindMapNodes, onNodeClick]
  );

  // Generate edges based on parent-child relationships
  const reactFlowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    mindMapNodes.forEach((node) => {
      if (node.children) {
        node.children.forEach((childId) => {
          edges.push({
            id: `${node.id}-${childId}`,
            source: node.id,
            target: childId,
            type: 'smoothstep',
            animated: true,
            style: {
              stroke: node.color,
              strokeWidth: 2,
            },
          });
        });
      }
    });

    return edges;
  }, [mindMapNodes]);

  const [nodes, , onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, , onEdgesChange] = useEdgesState(reactFlowEdges);

  const onConnect = useCallback(() => {
    // Prevent manual connections for now
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="bg-transparent"
      >
        <Background
          color="#e2e8f0"
          gap={20}
          size={1}
          className="opacity-30"
        />
        <Controls
          position="bottom-right"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg"
        />
        <MiniMap
          position="bottom-left"
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg"
          nodeColor={(node) => (node.data as { color?: string }).color || '#e2e8f0'}
          maskColor="rgb(240, 242, 247, 0.8)"
        />
      </ReactFlow>
    </motion.div>
  );
};
