'use client';

import React, { useCallback, useMemo, useEffect, useState, createContext, useContext, useRef } from 'react';
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
  ReactFlowInstance,
  ControlButton,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import dagre from 'dagre';
import { MindMapNode as CustomMindMapNode, MindMapHistory } from '@/types';
import { CustomNode } from './CustomNode';
import { ArrowLeft, Expand, Plus, Minus, Home } from 'lucide-react';
import { MindMapSelection } from '@/types';

interface MindMapFlowProps {
  nodes: CustomMindMapNode[];
  onNodeClick: (node: CustomMindMapNode) => void;
  onExpandNode?: (nodeId: string) => void;
  onCreateNewMindMap?: (nodeLabel: string, parentNodeId: string) => void;
  onCreateMindMapFromPDF?: (file: File, nodeLabel: string, parentNodeId: string) => void;
  onCreateMindMapFromText?: (text: string, nodeLabel: string, parentNodeId: string, isItems?: boolean) => void;
  onDeleteNode?: (nodeId: string) => void;
  onEditNodeLabel?: (nodeId: string, newLabel: string) => void;
  onNavigateToMindMap?: (mindMapId: string) => void;
  onNavigateBack?: () => void;
  getMindMapsForNode?: (nodeId: string) => MindMapSelection[];
  mindMapHistory?: MindMapHistory[];
  currentMindMapId?: string | null;
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

// Componente de controles personalizados com fitView suave
const CustomControls: React.FC = () => {
  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({
      padding: 0.2,
      includeHiddenNodes: false,
      duration: 800, // Transição suave de 800ms
    });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

  const handleReset = useCallback(() => {
    zoomTo(1, { duration: 300 });
  }, [zoomTo]);

  return (
    <Controls
      position="bottom-right"
      className="!bg-transparent !border-none !shadow-none"
      showZoom={false}
      showFitView={false}
      showInteractive={false}
    >
      <div className="flex flex-col gap-2 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Aumentar zoom"
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Diminuir zoom"
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitView}
          title="Ajustar visualização"
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Expand className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset zoom"
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg border border-slate-200 dark:border-slate-600 transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </Controls>
  );
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Criar uma nova instância do grafo Dagre para cada layout - isso garante estado limpo
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
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
    // Calcular dimensões dinâmicas baseadas no comprimento do label
    const textLength = (node.data as any)?.label?.length || 0;
    let width = 180;
    let height = 60;
    
    // Ajustar altura baseada no comprimento do texto
    if (textLength > 50) {
      height = 80;
    } else if (textLength > 80) {
      height = 100;
    } else if (textLength > 120) {
      height = 120;
    }
    
    // Ajustar largura e altura baseada no nível
    const level = (node.data as any)?.level || 0;
    switch (level) {
      case 0: 
        width = 200;
        height = Math.max(height, 96); // mínimo h-24
        break;
      case 1: 
        width = 160;
        height = Math.max(height, 80); // mínimo h-20
        break;
      case 2: 
        width = 128;
        height = Math.max(height, 64); // mínimo h-16
        break;
      default: 
        width = 112;
        height = Math.max(height, 56); // mínimo h-14
        break;
    }
    
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const nodeWidth = nodeWithPosition.width;
    const nodeHeight = nodeWithPosition.height;
    
    const newPosition = {
      x: nodeWithPosition.x - nodeWidth / 2, // Centralizar o nó baseado na largura real
      y: nodeWithPosition.y - nodeHeight / 2, // Centralizar o nó baseado na altura real
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
  onCreateMindMapFromPDF,
  onCreateMindMapFromText,
  onDeleteNode,
  onEditNodeLabel,
  onNavigateToMindMap,
  onNavigateBack,
  getMindMapsForNode,
  mindMapHistory,
  currentMindMapId,
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const reactFlowInstance = useRef<any>(null);

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
          onCreateMindMapFromPDF,
          onCreateMindMapFromText,
          onDeleteNode,
          onEditNodeLabel,
          onNavigateToMindMap,
          getMindMapsForNode,
          isLeafNode: isLeafNode(node.id),
          openMenuId,
          setOpenMenuId,
        },
        draggable: true,
        selectable: true,
      })),
    [mindMapNodes, onNodeClick, onExpandNode, onCreateNewMindMap, onDeleteNode, onEditNodeLabel, onNavigateToMindMap, getMindMapsForNode, isLeafNode, openMenuId, setOpenMenuId]
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

  // FitView automático sempre que os nós mudarem
  useEffect(() => {
    if (reactFlowInstance.current && layoutedNodes.length > 0) {
      // Usar setTimeout para garantir que os nós estejam renderizados
      const timer = setTimeout(() => {
        reactFlowInstance.current?.fitView({
          padding: 0.2,
          includeHiddenNodes: false,
          duration: 800, // Animação suave de 800ms
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [layoutedNodes.length, mindMapNodes]); // Dependência no comprimento dos nós e nos dados originais

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
        className="w-full h-full flex flex-col"
      >
        {/* Navigation Bar */}
        {mindMapHistory && mindMapHistory.length > 1 && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 px-4 py-2 flex items-center space-x-2">
            {/* Back Button */}
            {onNavigateBack && mindMapHistory.find(mm => mm.id === currentMindMapId)?.parentMindMapId && (
              <button
                onClick={onNavigateBack}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            )}
            
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              {mindMapHistory
                .filter(mm => {
                  // Mostrar apenas o caminho para o mapa atual
                  const current = mindMapHistory.find(m => m.id === currentMindMapId);
                  if (!current) return false;
                  
                  // Se é o mapa atual
                  if (mm.id === currentMindMapId) return true;
                  
                  // Se é um mapa pai no caminho
                  let parent: MindMapHistory | undefined = current;
                  while (parent?.parentMindMapId) {
                    const nextParent = mindMapHistory.find(m => m.id === parent?.parentMindMapId);
                    if (nextParent?.id === mm.id) return true;
                    parent = nextParent;
                    if (!parent) break;
                  }
                  
                  return false;
                })
                .sort((a, b) => {
                  // Ordenar do mais antigo (raiz) para o mais novo
                  if (!a.parentMindMapId) return -1;
                  if (!b.parentMindMapId) return 1;
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                })
                .map((mm, index, array) => (
                  <React.Fragment key={mm.id}>
                    <button
                      onClick={() => onNavigateToMindMap?.(mm.id)}
                      className={`px-2 py-1 rounded transition-colors ${
                        mm.id === currentMindMapId
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mm.title}
                    </button>
                    {index < array.length - 1 && (
                      <span className="text-slate-400 dark:text-slate-600">/</span>
                    )}
                  </React.Fragment>
                ))}
            </div>
          </div>
        )}

        {/* ReactFlow Container */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
            }}
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
            <CustomControls />
            <MiniMap
              position="bottom-left"
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg"
              nodeColor={(node) => (node.data as { color?: string }).color || '#e2e8f0'}
              maskColor="rgb(240, 242, 247, 0.8)"
            />
          </ReactFlow>
        </div>
      </motion.div>
    </MenuContext.Provider>
  );
};
