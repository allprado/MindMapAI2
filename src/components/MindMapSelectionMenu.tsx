'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Brain, FileText, Upload, List, Sparkles } from 'lucide-react';
import { MindMapSelection } from '@/types';

interface MindMapSelectionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  mindMaps: MindMapSelection[];
  onSelectMindMap: (mindMapId: string) => void;
  position: { x: number; y: number };
  nodeLabel: string;
}

const getMethodIcon = (method?: string) => {
  switch (method) {
    case 'auto':
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    case 'pdf':
      return <Upload className="w-4 h-4 text-blue-500" />;
    case 'text':
      return <FileText className="w-4 h-4 text-green-500" />;
    case 'items':
      return <List className="w-4 h-4 text-orange-500" />;
    default:
      return <Brain className="w-4 h-4 text-gray-500" />;
  }
};

const getMethodLabel = (method?: string) => {
  switch (method) {
    case 'auto':
      return 'IA';
    case 'pdf':
      return 'PDF';
    case 'text':
      return 'Texto';
    case 'items':
      return 'Itens';
    default:
      return 'Manual';
  }
};

export const MindMapSelectionMenu: React.FC<MindMapSelectionMenuProps> = ({
  isOpen,
  onClose,
  mindMaps,
  onSelectMindMap,
  position,
  nodeLabel,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  console.log(`[DEBUG] MindMapSelectionMenu - isOpen: ${isOpen}, mindMaps:`, mindMaps);
  console.log(`[DEBUG] MindMapSelectionMenu - position:`, position);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!isOpen) return null;

  // Calcular posição do menu para não sair da tela
  const menuStyle = {
    left: Math.min(position.x, window.innerWidth - 320), // 320px é a largura do menu
    top: Math.min(position.y, window.innerHeight - (mindMaps.length * 70 + 100)), // altura estimada
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[50000]">
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 min-w-[300px] max-w-[400px] overflow-hidden"
            style={menuStyle}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Mapas Mentais de &quot;{nodeLabel}&quot;
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecione um mapa para navegar
              </p>
            </div>

            {/* Mind Maps List */}
            <div className="max-h-[300px] overflow-y-auto">
              {mindMaps.map((mindMap, index) => (
                <motion.button
                  key={mindMap.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelectMindMap(mindMap.id);
                    onClose();
                  }}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                >
                  {/* Method Icon */}
                  <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-600 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-500 transition-colors">
                    {getMethodIcon(mindMap.creationMethod)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">
                        {mindMap.title}
                      </h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-full flex-shrink-0">
                        {getMethodLabel(mindMap.creationMethod)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(mindMap.createdAt)}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                {mindMaps.length} mapa{mindMaps.length !== 1 ? 's' : ''} disponível{mindMaps.length !== 1 ? 'eis' : ''}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
