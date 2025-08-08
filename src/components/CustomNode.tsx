'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { MindMapNode } from '@/types';

interface CustomNodeData {
  label: string;
  description: string;
  level: number;
  color: string;
  onClick: () => void;
  node: MindMapNode;
}

export const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const { label, level, color, onClick } = data as unknown as CustomNodeData;

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
        transition-all duration-200
        ${selected ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
      `}
      style={getNodeStyle()}
      onClick={onClick}
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
    </motion.div>
  );
};
