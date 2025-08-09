'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapNode } from '@/types';
import { Plus, Brain, ChevronDown } from 'lucide-react';

interface CustomNodeData {
  label: string;
  description: string;
  level: number;
  color: string;
  onClick: () => void;
  node: MindMapNode;
  onExpandNode?: (nodeId: string) => void;
  onCreateNewMindMap?: (nodeLabel: string) => void;
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
    isLeafNode,
    openMenuId,
    setOpenMenuId
  } = data as unknown as CustomNodeData;
  
  const [isHovered, setIsHovered] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const nodeRef = React.useRef<HTMLDivElement>(null);

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
    switch (level) {
      case 0: return 'w-48 h-24 text-lg'; // Central node
      case 1: return 'w-40 h-20 text-base'; // Main branches
      case 2: return 'w-32 h-16 text-sm'; // Secondary branches
      default: return 'w-28 h-14 text-xs'; // Leaf nodes
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
    onCreateNewMindMap?.(label);
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
      <div className="text-center">
        <div 
          className={`
            font-semibold text-slate-800 dark:text-slate-100 leading-tight
            ${level === 0 ? 'text-white' : ''}
          `}
        >
          {label}
        </div>
      </div>

      {/* Action Button for Leaf Nodes */}
      <AnimatePresence>
        {isLeafNode && (isHovered || isMenuOpen) && (
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
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};
