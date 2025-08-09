'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, Brain, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapFlow } from './MindMapFlow';
import { FileUpload } from './FileUpload';
import { TextInput } from './TextInput';
import { SidePanel } from './SidePanel';
import { MindMapNode } from '@/types';

export const MindMapApp: React.FC = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');

  const handleTextSubmit = useCallback(async (text: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar mapa mental');
      }

      const data = await response.json();
      setNodes(data.nodes);
    } catch (error) {
      console.error('Erro ao gerar mapa mental:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao processar PDF');
      }

      const data = await response.json();
      setNodes(data.nodes);
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((node: MindMapNode) => {
    setSelectedNode(node);
  }, []);

  const handleSidePanelClose = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleExpandNode = useCallback(async (nodeId: string) => {
    const nodeToExpand = nodes.find(n => n.id === nodeId);
    if (!nodeToExpand) return;

    console.log('Expandindo nó:', nodeToExpand);
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: `Expanda o tópico: ${nodeToExpand.label}. ${nodeToExpand.description}`,
          expandNode: true,
          parentNodeId: nodeId
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao expandir nó');
      }

      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      
      // Merge new nodes with existing ones
      setNodes(prevNodes => {
        console.log('Nós anteriores:', prevNodes);
        
        if (!data.nodes || data.nodes.length === 0) {
          console.log('Nenhum novo nó recebido');
          return prevNodes;
        }

        const updatedNodes = [...prevNodes];
        const parentNode = updatedNodes.find(n => n.id === nodeId);
        
        if (!parentNode) {
          console.log('Nó pai não encontrado:', nodeId);
          return prevNodes;
        }

        // Filtrar apenas os novos nós
        const newNodes = data.nodes.filter((n: MindMapNode) => 
          !updatedNodes.some(existing => existing.id === n.id)
        );
        
        console.log('Novos nós a adicionar:', newNodes);
        
        if (newNodes.length > 0) {
          // Add new child IDs to parent (evitando duplicatas)
          const newChildIds = newNodes.map((n: MindMapNode) => n.id);
          const existingChildIds = parentNode.children || [];
          const uniqueNewChildIds = newChildIds.filter((id: string) => !existingChildIds.includes(id));
          
          if (uniqueNewChildIds.length > 0) {
            parentNode.children = [...existingChildIds, ...uniqueNewChildIds];
          }
          
          // Definir propriedades básicas (Dagre calculará as posições)
          newNodes.forEach((newNode: MindMapNode) => {
            newNode.x = 0; // Será sobrescrito pelo Dagre
            newNode.y = 0; // Será sobrescrito pelo Dagre
            newNode.parent = nodeId;
            newNode.level = parentNode.level + 1;
          });
          
          // Add new nodes (verificando se já não existem)
          const finalNewNodes = newNodes.filter((newNode: MindMapNode) => 
            !updatedNodes.some(existing => existing.id === newNode.id)
          );
          
          if (finalNewNodes.length > 0) {
            updatedNodes.push(...finalNewNodes);
            console.log('Nós realmente adicionados:', finalNewNodes.length);
          } else {
            console.log('Nenhum nó novo foi adicionado (já existiam)');
          }
        }
        
        console.log('Nós finais:', updatedNodes);
        return updatedNodes;
      });
    } catch (error) {
      console.error('Erro ao expandir nó:', error);
      alert('Erro ao expandir nó: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [nodes]);

    const handleCreateNewMindMap = useCallback(async (nodeLabel: string) => {
    console.log('Criando novo mapa mental para:', nodeLabel);
    setIsLoading(true);
    try {
      // Unificar a chamada para ser idêntica à handleTextSubmit
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: nodeLabel 
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar novo mapa mental');
      }

      const data = await response.json();
      console.log('Novo mapa mental recebido:', data);
      setNodes(data.nodes);
      setSelectedNode(null);
    } catch (error) {
      console.error('Erro ao criar novo mapa mental:', error);
      alert('Erro ao criar novo mapa mental: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              MindMap AI
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Powered by Gemini 2.0 Flash
            </p>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)]">
        {/* Input Panel */}
        <motion.div
          initial={{ width: 400 }}
          animate={{ width: nodes.length > 0 ? 0 : 400 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
        >
          <div className="p-6 h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload PDF
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'text'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Text Input
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {activeTab === 'upload' ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TextInput onSubmit={handleTextSubmit} isLoading={isLoading} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 relative">
          {nodes.length > 0 ? (
            <MindMapFlow
              nodes={nodes}
              onNodeClick={handleNodeClick}
              onExpandNode={handleExpandNode}
              onCreateNewMindMap={handleCreateNewMindMap}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="mb-4">
                  <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Crie seu Mapa Mental
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  Faça upload de um PDF ou insira texto para gerar um mapa mental inteligente com IA
                </p>
              </motion.div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full mx-auto mb-4"
                />
                <p className="text-slate-600 dark:text-slate-400">
                  Gerando mapa mental...
                </p>
              </motion.div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {selectedNode && (
            <SidePanel
              node={selectedNode}
              onClose={handleSidePanelClose}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
