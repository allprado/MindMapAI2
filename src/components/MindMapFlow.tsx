'use client';

import React, { useCallback, useMemo, useEffect, useState, createContext, useContext } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  ConnectionLineType,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import dagre from 'dagre';
import { MindMapNode as CustomMindMapNode } from '@/types';
import { CustomNode } from './CustomNode';

interface MindMapFlowProps {
  nodes: CustomMindMapNode[];
  onNodeClick: (node: CustomMindMapNode) => void;
  onExpandNode?: (nodeId: string) => void;
  onCreateNewMindMap?: (nodeLabel: string) => void;
  isLoading: boolean;
}

// Context para gerenciar menu aberto globalmente
interface MenuContextType {
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

const MenuContext = createContext<MenuContextType | null>(null);

export const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within MenuContext.Provider');
  }
  return context;
};

const nodeTypes = {
  custom: CustomNode,
};

// Configuração do Dagre conforme a imagem
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Configurações otimizadas para mapas mentais mais compactos
  dagreGraph.setGraph({ 
    rankdir: 'LR', // Rank Direction: LR (Left to Right)
    nodesep: 30, // Node Separation: reduzido de 50 para 30
    edgesep: 5, // Edge Separation: reduzido de 10 para 5
    ranksep: 100, // Rank Separation: aumentado de 50 para 100 (mais espaço horizontal)
    marginx: 20, // Horizontal Margin: 20
    marginy: 20, // Vertical Margin: 20
    acyclicer: undefined, // Acyclic Algorithm: Select (deixamos undefined)
    ranker: 'network-simplex' // Ranking Algorithm: network-simple
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 60 }); // Reduzido de 200x80 para 180x60
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newPosition = {
      x: nodeWithPosition.x - 90, // Centralizar o nó (metade de 180)
      y: nodeWithPosition.y - 30, // Centralizar o nó (metade de 60)
    };
    return {
      ...node,
      position: newPosition,
    };
  });

  // Garantir que as edges sejam retornadas corretamente
  const layoutedEdges = edges.map(edge => ({
    ...edge,
    type: edge.type || 'default',
    style: edge.style || { strokeWidth: 2, stroke: '#666' },
    animated: edge.animated !== false,
    markerEnd: edge.markerEnd || 'arrowclosed',
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

export const MindMapFlow: React.FC<MindMapFlowProps> = ({
  nodes: mindMapNodes,
  onNodeClick,
  onExpandNode,
  onCreateNewMindMap,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Helper function to check if a node is a leaf node (has no children)
  const isLeafNode = useCallback((nodeId: string) => {
    const node = mindMapNodes.find(n => n.id === nodeId);
    const hasChildren = node?.children && node.children.length > 0;
    return !hasChildren;
  }, [mindMapNodes]);

  // Convert mindmap nodes to ReactFlow nodes (posições serão definidas pelo Dagre)
  const initialNodes: Node[] = useMemo(
    () =>
      mindMapNodes.map((node) => ({
        id: node.id,
        type: 'custom',
        position: { x: 0, y: 0 }, // Será sobrescrito pelo Dagre
        data: {
          label: node.label,
          description: node.description,
          level: node.level,
          color: node.color,
          onClick: () => onNodeClick(node),
          node: node,
          onExpandNode,
          onCreateNewMindMap,
          isLeafNode: isLeafNode(node.id),
          openMenuId,
          setOpenMenuId,
        },
        draggable: true,
        selectable: true,
      })),
    [mindMapNodes, onNodeClick, onExpandNode, onCreateNewMindMap, isLeafNode, openMenuId, setOpenMenuId]
  );

  // Generate edges based on parent-child relationships
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const edgeIds = new Set<string>(); // Para evitar duplicatas
    
    mindMapNodes.forEach((node) => {
      if (node.children) {
        node.children.forEach((childId) => {
          // Verificar se o nó filho existe
          const childNode = mindMapNodes.find(n => n.id === childId);
          const edgeId = `${node.id}-${childId}`;
          
          if (childNode && !edgeIds.has(edgeId)) {
            edgeIds.add(edgeId);
            const edge = {
              id: edgeId,
              source: node.id,
              target: childId,
              type: 'default',
              style: {
                stroke: node.color || '#666',
                strokeWidth: 2,
              },
              animated: true,
              markerEnd: 'arrowclosed',
            };
            edges.push(edge);
          }
        });
      }
    });

    return edges;
  }, [mindMapNodes]);

  // Aplicar layout Dagre
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (initialNodes.length === 0) return { nodes: [], edges: [] };
    return getLayoutedElements(initialNodes, initialEdges);
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Atualizar nodes e edges quando os dados mudam
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => {
    console.log('Tentativa de conexão:', params);
    // Remover qualquer referência a handles
    const { sourceHandle, targetHandle, ...cleanParams } = params;
    
    if (cleanParams.source && cleanParams.target) {
      setEdges((eds) => addEdge({
        ...cleanParams,
        type: 'default',
        animated: true,
        style: { strokeWidth: 2, stroke: '#666' },
        markerEnd: 'arrowclosed',
      }, eds));
    }
  }, [setEdges]);

  // Fechar menu quando clicar no fundo do ReactFlow
  const onPaneClick = useCallback(() => {
    setOpenMenuId(null);
  }, [setOpenMenuId]);

  return (
    <MenuContext.Provider value={{ openMenuId, setOpenMenuId }}>
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
          onPaneClick={onPaneClick}
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
        connectionLineType={ConnectionLineType.Bezier}
        snapToGrid={false}
        snapGrid={[15, 15]}
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
    </MenuContext.Provider>
  );
};
