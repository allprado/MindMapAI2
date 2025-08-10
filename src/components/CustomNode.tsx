'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapNode, MindMapSelection } from '@/types';
import { Plus, Brain, ChevronDown, Trash2, ExternalLink, Edit2, Check, X } from 'lucide-react';
import { NewMindMapModal } from './NewMindMapModal';
import { MindMapSelectionMenu } from './MindMapSelectionMenu';

interface CustomNodeData {
  label: string;
  description: string;
  level: number;
  color: string;
  onClick: () => void;
  node: MindMapNode;
  onExpandNode?: (nodeId: string) => void;
  onCreateNewMindMap?: (nodeLabel: string, parentNodeId: string) => void;
  onCreateMindMapFromPDF?: (file: File, nodeLabel: string, parentNodeId: string) => void;
  onCreateMindMapFromText?: (text: string, nodeLabel: string, parentNodeId: string, isItems?: boolean) => void;
  onDeleteNode?: (nodeId: string) => void;
  onNavigateToMindMap?: (mindMapId: string) => void;
  onEditNodeLabel?: (nodeId: string, newLabel: string) => void;
  getMindMapsForNode?: (nodeId: string) => MindMapSelection[];
  isLeafNode?: boolean;
  openMenuId?: string | null;
  setOpenMenuId?: (id: string | null) => void;
}

export const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { 
    label, 
    level, 
    color, 
    onClick, 
    node, 
    onExpandNode, 
    onCreateNewMindMap, 
    onCreateMindMapFromPDF,
    onCreateMindMapFromText,
    onDeleteNode,
    onNavigateToMindMap,
    onEditNodeLabel,
    getMindMapsForNode,
    isLeafNode,
    openMenuId,
    setOpenMenuId
  } = data as unknown as CustomNodeData;
  
  const [isHovered, setIsHovered] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showMindMapModal, setShowMindMapModal] = useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(label);
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Verificar se é o nó central (level 0)
  const isCentralNode = level === 0;

  // Verificar se este menu está aberto
  const isMenuOpen = openMenuId === node.id;

  // Effect to handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Fechar menu se:
      // 1. Clicou fora do nó atual
      // 2. Clicou em outro nó
      // 3. Clicou no ReactFlow em geral
      if (isMenuOpen && 
          !target.closest(`[data-node-id="${node.id}"]`) && 
          !target.closest('.floating-menu')) {
        setOpenMenuId?.(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setOpenMenuId?.(null);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMenuOpen, node.id, setOpenMenuId]);

  const getNodeSize = () => {
    // Calcular altura dinâmica baseada no comprimento do texto
    const textLength = label.length;
    let dynamicHeight = 'h-16'; // altura padrão
    
    if (textLength > 50) {
      dynamicHeight = 'h-24';
    } else if (textLength > 80) {
      dynamicHeight = 'h-32';
    } else if (textLength > 120) {
      dynamicHeight = 'h-40';
    }
    
    switch (level) {
      case 0: return `w-48 ${dynamicHeight} text-lg`; // Central node
      case 1: return `w-40 ${dynamicHeight} text-base`; // Main branches
      case 2: return `w-32 ${dynamicHeight} text-sm`; // Secondary branches
      default: return `w-28 ${dynamicHeight} text-xs`; // Leaf nodes
    }
  };

  const getNodeStyle = () => {
    if (level === 0) {
      return {
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        border: '3px solid rgba(255, 255, 255, 0.8)',
      };
    }
    
    return {
      background: `linear-gradient(135deg, ${color}20, ${color}40)`,
      border: `2px solid ${color}60`,
    };
  };

  const handleExpandNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId?.(null);
    onExpandNode?.(node.id);
  };

  const handleCreateNewMindMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId?.(null);
    setShowMindMapModal(true);
  };

  const handleCreateAutomatic = () => {
    onCreateNewMindMap?.(label, node.id);
  };

  const handleCreateFromPDF = (file: File) => {
    onCreateMindMapFromPDF?.(file, label, node.id);
  };

  const handleCreateFromText = (text: string, isItems?: boolean) => {
    onCreateMindMapFromText?.(text, label, node.id, isItems);
  };

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId?.(null);
    
    // Confirmar exclusão se o nó tiver filhos
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      const confirmDelete = window.confirm(
        `Tem certeza que deseja excluir o nó "${label}" e todos os seus filhos?`
      );
      if (!confirmDelete) return;
    }
    
    onDeleteNode?.(node.id);
  };

  const handleNavigateToChildMindMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Verificar se existem múltiplos mapas mentais
    const childMindMaps = getMindMapsForNode?.(node.id) || [];
    console.log(`[DEBUG] Node ${node.id} - childMindMaps:`, childMindMaps);
    console.log(`[DEBUG] Node ${node.id} - hasChildMindMaps:`, node.hasChildMindMaps);
    console.log(`[DEBUG] Node ${node.id} - hasChildMindMap:`, node.hasChildMindMap);
    console.log(`[DEBUG] Node ${node.id} - childMindMapIds:`, node.childMindMapIds);
    
    if (childMindMaps.length > 1) {
      // Mostrar menu de seleção
      console.log(`[DEBUG] Showing selection menu for node ${node.id}`);
      if (nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        setSelectionMenuPosition({
          x: rect.right + 8,
          y: rect.top
        });
        setShowSelectionMenu(true);
      }
    } else if (childMindMaps.length === 1) {
      // Navegar diretamente para o único mapa
      console.log(`[DEBUG] Navigating to single mind map:`, childMindMaps[0]);
      onNavigateToMindMap?.(childMindMaps[0].id);
    } else if (node.childMindMapId && onNavigateToMindMap) {
      // Compatibilidade com versão anterior
      console.log(`[DEBUG] Using legacy navigation to:`, node.childMindMapId);
      onNavigateToMindMap(node.childMindMapId);
    }
  };

  const handleSelectMindMap = (mindMapId: string) => {
    onNavigateToMindMap?.(mindMapId);
    setShowSelectionMenu(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isMenuOpen && nodeRef.current) {
      // Calcular posição absoluta do menu
      const rect = nodeRef.current.getBoundingClientRect();
      setMenuPosition({
        x: rect.right + 8, // 8px de margem
        y: rect.top
      });
      setOpenMenuId?.(node.id);
    } else {
      setOpenMenuId?.(null);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCentralNode) {
      setIsEditing(true);
      setEditingLabel(label);
      // Focar no input após um pequeno delay para garantir que foi renderizado
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingLabel(label);
  };

  const handleSaveEdit = () => {
    const trimmedLabel = editingLabel.trim();
    if (trimmedLabel && trimmedLabel !== label && onEditNodeLabel) {
      onEditNodeLabel(node.id, trimmedLabel);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  return (
    <motion.div
      ref={nodeRef}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: level === 0 ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: level * 0.1
      }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
      }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${getNodeSize()}
        rounded-xl cursor-pointer backdrop-blur-sm
        flex items-center justify-center p-3
        transition-all duration-200 relative
        ${selected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
      `}
      style={getNodeStyle()}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-node-id={node.id}
    >
      {/* Handles invisíveis mas funcionais */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />

      {/* Node Content */}
      <div className="text-center flex items-center justify-center h-full px-2 relative">
        {isEditing && isCentralNode ? (
          // Modo de edição - apenas para nó central
          <div className="flex items-center space-x-2 w-full">
            <input
              ref={inputRef}
              type="text"
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="flex-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-purple-300 dark:border-purple-600 rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Digite o título do mapa mental..."
            />
            <button
              onClick={handleSaveEdit}
              className="p-1 text-green-600 hover:text-green-700 transition-colors"
              title="Salvar"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 text-red-600 hover:text-red-700 transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Modo de visualização
          <div 
            className={`
              font-semibold text-slate-800 dark:text-slate-100 leading-tight relative group
              ${level === 0 ? 'text-white' : ''}
              ${label.length > 40 ? 'text-xs leading-tight' : ''}
              ${label.length > 80 ? 'text-xs leading-snug' : ''}
              break-words hyphens-auto
              ${isCentralNode ? 'cursor-pointer' : ''}
            `}
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
            }}
            onClick={isCentralNode ? handleStartEdit : undefined}
          >
            {label}
            {/* Ícone de edição - apenas para nó central */}
            {isCentralNode && isHovered && !isEditing && (
              <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
                <Edit2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button for ALL Nodes (not just leaf nodes) */}
      <AnimatePresence>
        {(isHovered || isMenuOpen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2"
          >
            <button
              onClick={toggleMenu}
              className={`w-8 h-8 border-2 border-purple-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
                isMenuOpen 
                  ? 'bg-purple-500 dark:bg-purple-600' 
                  : 'bg-white dark:bg-slate-700'
              }`}
            >
              <Plus className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                isMenuOpen 
                  ? 'text-white rotate-45' 
                  : 'text-purple-600 dark:text-purple-400'
              }`} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigate to Child MindMap Button - Always visible when has child mindmap */}
      <AnimatePresence>
        {(() => {
          const hasChildMindMaps = node.hasChildMindMaps || node.hasChildMindMap;
          const mindMapsFromFunction = (getMindMapsForNode?.(node.id) || []).length > 0;
          const shouldShowLink = hasChildMindMaps || mindMapsFromFunction;
          
          if (node.id === '1') { // Log apenas para o nó raiz para não poluir o console
            console.log(`[DEBUG] Node ${node.id} - shouldShowLink:`, shouldShowLink);
            console.log(`[DEBUG] Node ${node.id} - hasChildMindMaps:`, hasChildMindMaps);
            console.log(`[DEBUG] Node ${node.id} - mindMapsFromFunction:`, mindMapsFromFunction);
            console.log(`[DEBUG] Node ${node.id} - getMindMapsForNode result:`, getMindMapsForNode?.(node.id));
          }
          
          return shouldShowLink;
        })() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-3 -top-2"
          >
            <button
              onClick={handleNavigateToChildMindMap}
              className="w-7 h-7 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              title={
                (getMindMapsForNode?.(node.id) || []).length > 1 
                  ? "Selecionar mapa mental" 
                  : "Navegar para mapa mental filho"
              }
            >
              <ExternalLink className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Menu using Portal */}
      {isMenuOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed floating-menu"
            style={{ 
              left: menuPosition.x,
              top: menuPosition.y,
              zIndex: 999999,
              pointerEvents: 'auto'
            }}
            data-node-id={node.id}
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden min-w-48"
                 style={{ 
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                   position: 'relative',
                   zIndex: 1
                 }}>
              {/* Expandir Tópico - apenas para nós folha */}
              {isLeafNode && (
                <>
                  <button
                    onClick={handleExpandNode}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3"
                  >
                    <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                        Expandir Tópico
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Criar mais subnós
                      </div>
                    </div>
                  </button>
                  
                  <div className="border-t border-slate-200 dark:border-slate-600" />
                </>
              )}
              
              {/* Criar Novo Mapa Mental - para todos os nós */}
              <button
                onClick={handleCreateNewMindMap}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center space-x-3"
              >
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    Novo Mapa Mental
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Criar mapa sobre este tópico
                  </div>
                </div>
              </button>

              {/* Separador para ações destrutivas - para todos os nós exceto o raiz */}
              {level > 0 && (
                <>
                  <div className="border-t border-slate-200 dark:border-slate-600" />
                  
                  {/* Excluir Nó */}
                  <button
                    onClick={handleDeleteNode}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <div>
                      <div className="font-medium text-red-800 dark:text-red-200 text-sm">
                        Excluir Nó
                      </div>
                      <div className="text-xs text-red-500 dark:text-red-400">
                        {node.children && node.children.length > 0 
                          ? 'Excluirá este nó e todos os filhos'
                          : 'Excluir este nó'
                        }
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* New Mind Map Modal */}
      <NewMindMapModal
        isOpen={showMindMapModal}
        onClose={() => setShowMindMapModal(false)}
        nodeLabel={label}
        onCreateAutomatic={handleCreateAutomatic}
        onCreateFromPDF={handleCreateFromPDF}
        onCreateFromText={handleCreateFromText}
      />

      {/* Mind Map Selection Menu */}
      {showSelectionMenu && createPortal(
        <MindMapSelectionMenu
          isOpen={showSelectionMenu}
          onClose={() => setShowSelectionMenu(false)}
          mindMaps={getMindMapsForNode?.(node.id) || []}
          onSelectMindMap={handleSelectMindMap}
          position={selectionMenuPosition}
          nodeLabel={label}
        />,
        document.body
      )}
    </motion.div>
  );
};
