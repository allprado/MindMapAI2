'use client';

import React, { useState } from 'react';
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
    isLeafNode 
  } = data as unknown as CustomNodeData;
  
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Effect to handle clicks outside the menu
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMenu && !target.closest(`[data-node-id="${node.id}"]`)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, node.id]);

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
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      };
    }
    
    return {
      background: `linear-gradient(135deg, ${color}20, ${color}40)`,
      border: `2px solid ${color}60`,
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    };
  };

  const handleExpandNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onExpandNode?.(node.id);
  };

  const handleCreateNewMindMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onCreateNewMindMap?.(label);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
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
      {/* Input Handle */}
      {level > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 border-2 border-white bg-slate-400"
        />
      )}

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

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-white bg-slate-400"
      />

      {/* Action Button for Leaf Nodes */}
      <AnimatePresence>
        {isLeafNode && (isHovered || showMenu) && (
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
                showMenu 
                  ? 'bg-purple-500 dark:bg-purple-600' 
                  : 'bg-white dark:bg-slate-700'
              }`}
            >
              <Plus className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                showMenu 
                  ? 'text-white rotate-45' 
                  : 'text-purple-600 dark:text-purple-400'
              }`} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 z-50"
            data-node-id={node.id}
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden min-w-48">
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
        )}
      </AnimatePresence>
    </motion.div>
  );
};
