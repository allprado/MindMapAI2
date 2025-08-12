'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, Brain, Sparkles, User, LogOut, Save, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapFlow } from './MindMapFlow';
import { FileUpload } from './FileUpload';
import { TextInput } from './TextInput';
import { SidePanel } from './SidePanel';
import { AuthModal } from './AuthModal';
import { SavedMindMaps } from './SavedMindMaps';
import { useAuth } from '@/contexts/AuthContext';
import { MindMapService } from '@/lib/mindmap-service';
import { supabase } from '@/lib/supabase';
import { MindMapNode, MindMapHistory } from '@/types';
import { MindMap } from '@/lib/supabase';

// Função para extrair o título do texto de itens
const extractTitleFromItems = (itemsText: string): string => {
  const lines = itemsText.trim().split('\n');
  const firstLine = lines[0]?.trim();
  
  // Se a primeira linha não começar com número, é provavelmente o título
  if (firstLine && !firstLine.match(/^\d+(\.\d+)*\s/)) {
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }
  
  return 'Mapa Mental de Itens';
};

// Função para converter estrutura de itens em nós do mapa mental
const parseItemsToNodes = (itemsText: string): MindMapNode[] => {
  const lines = itemsText.trim().split('\n').filter(line => line.trim());
  const nodes: MindMapNode[] = [];
  const nodeMap = new Map<string, MindMapNode>();
  
  let rootTitle = 'Mapa Mental';
  let startIndex = 0;
  
  // Verificar se a primeira linha é um título (não começa com número)
  if (lines[0] && !lines[0].trim().match(/^\d+(\.\d+)*\s/)) {
    rootTitle = lines[0].trim();
    startIndex = 1;
  }
  
  // Criar nó raiz
  const rootNode: MindMapNode = {
    id: '1',
    label: rootTitle,
    description: 'Nó principal do mapa mental',
    level: 0,
    x: 0,
    y: 0,
    color: '#8b5cf6',
    children: [],
  };
  nodes.push(rootNode);
  nodeMap.set('root', rootNode);
  
  // Processar cada linha
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Extrair numeração e texto
    const match = line.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
    if (!match) continue;
    
    const [, numbering, text] = match;
    const parts = numbering.split('.');
    const level = parts.length;
    const nodeId = `node-${numbering}`;
    
    // Determinar cor baseada no nível
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const color = colors[level] || colors[colors.length - 1];
    
    // Criar nó
    const node: MindMapNode = {
      id: nodeId,
      label: text,
      description: `${text} (Nível ${level})`,
      level: level,
      x: 0,
      y: 0,
      color: color,
      children: [],
    };
    
    nodes.push(node);
    nodeMap.set(numbering, node);
    
    // Determinar o nó pai
    let parentKey = 'root';
    let parentNode = rootNode;
    
    if (level > 1) {
      // Para subitens, encontrar o pai
      const parentParts = parts.slice(0, -1);
      const parentNumbering = parentParts.join('.');
      const parentNodeFromMap = nodeMap.get(parentNumbering);
      
      if (parentNodeFromMap) {
        parentKey = parentNumbering;
        parentNode = parentNodeFromMap;
        node.parent = parentNode.id;
      } else {
        // Se não encontrar o pai, conectar à raiz
        node.parent = rootNode.id;
      }
    } else {
      // Itens de nível 1 são filhos da raiz
      node.parent = rootNode.id;
    }
    
    // Adicionar este nó como filho do pai
    if (!parentNode.children) {
      parentNode.children = [];
    }
    parentNode.children.push(nodeId);
  }
  
  return nodes;
};

export const MindMapApp: React.FC = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [mindMapHistory, setMindMapHistory] = useState<MindMapHistory[]>([]);
  const [currentMindMapId, setCurrentMindMapId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavedMindMaps, setShowSavedMindMaps] = useState(false);
  const [currentSavedMindMap, setCurrentSavedMindMap] = useState<MindMap | null>(null);

  const { user, signOut } = useAuth();

  // Helper function to get headers with authentication
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    return headers
  }

  // Função para salvar todos os mapas mentais da hierarquia
  const handleSaveMindMap = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (nodes.length === 0 && mindMapHistory.length === 0) {
      return;
    }

    console.log('🔄 Salvando hierarquia completa de mapas mentais...');
    console.log('📊 Total de mapas no histórico:', mindMapHistory.length);
    console.log('📊 Mapa atual - nós:', nodes.length);
    
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      
      // Salvar todos os mapas do histórico
      for (const mindMap of mindMapHistory) {
        const rootNode = mindMap.nodes.find(n => n.level === 0);
        const title = rootNode?.label || mindMap.title || 'Mapa Mental Sem Título';
        
        console.log(`💾 Salvando mapa: ${title} (ID: ${mindMap.id})`);
        
        // Verificar se é o mapa principal (sem parentMindMapId)
        const isMainMap = !mindMap.parentMindMapId;
        
        if (isMainMap && currentSavedMindMap) {
          // Atualizar mapa principal existente
          console.log('📝 Atualizando mapa principal:', currentSavedMindMap.id);
          const response = await fetch(`/api/mindmaps/${currentSavedMindMap.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              title,
              nodes: mindMap.nodes,
              edges: [],
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Mapa principal atualizado:', data.id);
          } else {
            const error = await response.json();
            console.error('❌ Erro ao atualizar mapa principal:', error);
          }
        } else {
          // Criar novo mapa (principal ou secundário)
          console.log(`🆕 Criando ${isMainMap ? 'mapa principal' : 'mapa secundário'}`);
          const response = await fetch('/api/mindmaps', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title,
              description: rootNode?.description,
              nodes: mindMap.nodes,
              edges: [],
              isPublic: false,
              // Metadados para identificar mapas secundários
              tags: mindMap.parentMindMapId ? [`parent:${mindMap.parentMindMapId}`, `node:${mindMap.parentNodeId}`] : [],
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${isMainMap ? 'Mapa principal' : 'Mapa secundário'} criado:`, data.id);
            
            if (isMainMap) {
              setCurrentSavedMindMap(data);
            }
          } else {
            const error = await response.json();
            console.error(`❌ Erro ao criar ${isMainMap ? 'mapa principal' : 'mapa secundário'}:`, error);
          }
        }
      }
      
      console.log('🎉 Hierarquia completa salva com sucesso!');
      alert(`Hierarquia completa salva! Total: ${mindMapHistory.length} mapa(s) mental(is)`);
      
    } catch (error) {
      console.error('💥 Erro no salvamento da hierarquia:', error);
      alert('Erro ao salvar hierarquia de mapas mentais');
    } finally {
      setIsLoading(false);
    }
  }, [user, nodes, mindMapHistory, currentSavedMindMap]);

  // Função para carregar um mapa mental salvo
  const handleLoadMindMap = useCallback((mindMap: MindMap) => {
    console.log('📂 Carregando mapa mental:', mindMap.title);
    console.log('📊 Nós carregados:', mindMap.nodes.length);
    console.log('🌳 Estrutura carregada:', mindMap.nodes.map(n => ({ id: n.id, label: n.label, parent: n.parent, children: n.children })));
    
    setNodes(mindMap.nodes);
    setCurrentSavedMindMap(mindMap);
    setCurrentMindMapId(`loaded-${mindMap.id}`);
    
    // Criar entrada no histórico
    const newMindMapHistory: MindMapHistory = {
      id: `loaded-${mindMap.id}`,
      nodes: mindMap.nodes,
      title: mindMap.title,
      createdAt: new Date(mindMap.created_at),
    };
    
    setMindMapHistory([newMindMapHistory]);
  }, []);

  // Função para criar novo mapa mental (limpar tudo)
  const handleCreateNewMindMapFromScratch = useCallback(() => {
    setNodes([]);
    setSelectedNode(null);
    setMindMapHistory([]);
    setCurrentMindMapId(null);
    setCurrentSavedMindMap(null);
  }, []);

  // Função para fazer logout
  const handleSignOut = useCallback(async () => {
    await signOut();
    setCurrentSavedMindMap(null);
  }, [signOut]);

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
      
      // Criar novo mapa mental no histórico
      const newMindMapId = `mindmap-${Date.now()}`;
      const newMindMap: MindMapHistory = {
        id: newMindMapId,
        nodes: data.nodes,
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        createdAt: new Date(),
      };

      setMindMapHistory(prev => [...prev, newMindMap]);
      setCurrentMindMapId(newMindMapId);
      setNodes(data.nodes);
    } catch (error) {
      console.error('Erro ao gerar mapa mental:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleItemsSubmit = useCallback(async (itemsText: string) => {
    setIsLoading(true);
    try {
      // Processar os itens localmente sem chamada para IA
      const nodes = parseItemsToNodes(itemsText);
      
      // Criar novo mapa mental no histórico
      const newMindMapId = `mindmap-${Date.now()}`;
      const title = extractTitleFromItems(itemsText);
      const newMindMap: MindMapHistory = {
        id: newMindMapId,
        nodes: nodes,
        title: title,
        createdAt: new Date(),
      };

      setMindMapHistory(prev => [...prev, newMindMap]);
      setCurrentMindMapId(newMindMapId);
      setNodes(nodes);
    } catch (error) {
      console.error('Erro ao processar itens:', error);
      alert('Erro ao processar a estrutura de itens. Verifique o formato.');
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
      
      // Criar novo mapa mental no histórico
      const newMindMapId = `mindmap-${Date.now()}`;
      const newMindMap: MindMapHistory = {
        id: newMindMapId,
        nodes: data.nodes,
        title: file.name.replace('.pdf', ''),
        createdAt: new Date(),
      };

      setMindMapHistory(prev => [...prev, newMindMap]);
      setCurrentMindMapId(newMindMapId);
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
      
      // 🔥 AUTO-SAVE: Salvar automaticamente após expansão do nó
      console.log('🔥 AUTO-SAVE: Salvando mapa após expansão de nó...');
      setTimeout(() => {
        if (currentSavedMindMap) {
          console.log('🔥 AUTO-SAVE: Executando salvamento automático...');
          handleSaveMindMap();
        }
      }, 1000); // Delay para garantir que o estado foi atualizado
      
    } catch (error) {
      console.error('Erro ao expandir nó:', error);
      alert('Erro ao expandir nó: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [nodes]);

  const handleCreateNewMindMap = useCallback(async (nodeLabel: string, parentNodeId: string) => {
    console.log('Criando novo mapa mental para:', nodeLabel);
    setIsLoading(true);
    try {
      // Criar novo mapa mental detalhado com a flag apropriada e timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: nodeLabel,
          newMindMap: true  // Flag para indicar criação de novo mapa mental detalhado
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Falha ao criar novo mapa mental');
      }

      const data = await response.json();
      console.log('Novo mapa mental recebido:', data);
      
      // Criar novo mapa mental no histórico
      const newMindMapId = `mindmap-${Date.now()}`;
      const newMindMap: MindMapHistory = {
        id: newMindMapId,
        parentNodeId: parentNodeId,
        parentMindMapId: currentMindMapId || undefined,
        nodes: data.nodes,
        title: nodeLabel,
        createdAt: new Date(),
        creationMethod: 'auto',
      };

      setMindMapHistory(prev => [...prev, newMindMap]);
      
      // Atualizar o nó pai para incluir o novo mapa mental
      const updateNodeWithChildMindMap = (node: MindMapNode, newMindMapId: string) => {
        if (node.id === parentNodeId) {
          const currentChildMindMapIds = node.childMindMapIds || [];
          return {
            ...node,
            hasChildMindMaps: true,
            childMindMapIds: [...currentChildMindMapIds, newMindMapId],
            // Manter compatibilidade com versão anterior
            hasChildMindMap: true,
            childMindMapId: currentChildMindMapIds.length === 0 ? newMindMapId : node.childMindMapId,
          };
        }
        return node;
      };

      // Atualizar o histórico
      setMindMapHistory(prevHistory => 
        prevHistory.map(mindMap => 
          mindMap.id === currentMindMapId 
            ? {
                ...mindMap,
                nodes: mindMap.nodes.map(node => updateNodeWithChildMindMap(node, newMindMapId))
              }
            : mindMap
        )
      );
      
      // Atualizar os nós atuais
      setNodes(prevNodes => 
        prevNodes.map(node => updateNodeWithChildMindMap(node, newMindMapId))
      );
      
      // Navegar para o novo mapa mental
      setCurrentMindMapId(newMindMapId);
      setNodes(data.nodes);
      setSelectedNode(null);
      
      // 🔥 AUTO-SAVE: Salvar hierarquia completa após criar novo mapa mental
      console.log('🔥 AUTO-SAVE: Salvando hierarquia após criação de novo mapa...');
      setTimeout(() => {
        console.log('🔥 AUTO-SAVE: Executando salvamento automático da hierarquia...');
        handleSaveMindMap();
      }, 1500); // Delay para garantir que o estado foi atualizado
      
    } catch (error) {
      console.error('Erro ao criar novo mapa mental:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          alert('A criação do mapa mental demorou muito e foi cancelada. Tente novamente com um tópico mais específico.');
        } else {
          alert('Erro ao criar novo mapa mental: ' + error.message);
        }
      } else {
        alert('Erro desconhecido ao criar novo mapa mental');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentMindMapId, handleSaveMindMap]);

  const handleCreateMindMapFromPDF = useCallback(async (file: File, nodeLabel: string, parentNodeId: string) => {
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
      
      // Criar novo mapa mental no histórico
      const newMindMapId = `mindmap-${Date.now()}`;
      const newMindMap: MindMapHistory = {
        id: newMindMapId,
        parentNodeId: parentNodeId,
        parentMindMapId: currentMindMapId || undefined,
        nodes: data.nodes,
        title: `${nodeLabel} - ${file.name.replace('.pdf', '')}`,
        createdAt: new Date(),
        creationMethod: 'pdf',
      };

      setMindMapHistory(prev => [...prev, newMindMap]);
      
      // Atualizar o nó pai para incluir o novo mapa mental
      const updateNodeWithChildMindMap = (node: MindMapNode, newMindMapId: string) => {
        if (node.id === parentNodeId) {
          const currentChildMindMapIds = node.childMindMapIds || [];
          return {
            ...node,
            hasChildMindMaps: true,
            childMindMapIds: [...currentChildMindMapIds, newMindMapId],
            // Manter compatibilidade com versão anterior
            hasChildMindMap: true,
            childMindMapId: currentChildMindMapIds.length === 0 ? newMindMapId : node.childMindMapId,
          };
        }
        return node;
      };

      // Atualizar o histórico
      setMindMapHistory(prevHistory => 
        prevHistory.map(mindMap => 
          mindMap.id === currentMindMapId 
            ? {
                ...mindMap,
                nodes: mindMap.nodes.map(node => updateNodeWithChildMindMap(node, newMindMapId))
              }
            : mindMap
        )
      );
      
      // Atualizar os nós atuais
      setNodes(prevNodes => 
        prevNodes.map(node => updateNodeWithChildMindMap(node, newMindMapId))
      );
      
      // Navegar para o novo mapa mental
      setCurrentMindMapId(newMindMapId);
      setNodes(data.nodes);
      setSelectedNode(null);
      
      // 🔥 AUTO-SAVE: Salvar hierarquia completa após criar mapa a partir de PDF
      console.log('🔥 AUTO-SAVE: Salvando hierarquia após criação de mapa a partir de PDF...');
      setTimeout(() => {
        console.log('🔥 AUTO-SAVE: Executando salvamento automático da hierarquia...');
        handleSaveMindMap();
      }, 1500); // Delay para garantir que o estado foi atualizado
      
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      alert('Erro ao processar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [currentMindMapId, handleSaveMindMap]);

  const handleCreateMindMapFromText = useCallback(async (text: string, nodeLabel: string, parentNodeId: string, isItems?: boolean) => {
    setIsLoading(true);
    try {
      let nodes;
      
      if (isItems) {
        // Processar os itens localmente sem chamada para IA
        nodes = parseItemsToNodes(text);
      } else {
        // Usar IA para processar texto livre
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
        nodes = data.nodes;
      }
      
      // Criar novo mapa mental no histórico
      const newMindMapId = `mindmap-${Date.now()}`;
      const title = isItems ? extractTitleFromItems(text) : `${nodeLabel} - Texto`;
      const newMindMap: MindMapHistory = {
        id: newMindMapId,
        parentNodeId: parentNodeId,
        parentMindMapId: currentMindMapId || undefined,
        nodes: nodes,
        title: title,
        createdAt: new Date(),
        creationMethod: isItems ? 'items' : 'text',
      };

      setMindMapHistory(prev => [...prev, newMindMap]);
      
      // Atualizar o nó pai para incluir o novo mapa mental
      const updateNodeWithChildMindMap = (node: MindMapNode, newMindMapId: string) => {
        if (node.id === parentNodeId) {
          const currentChildMindMapIds = node.childMindMapIds || [];
          return {
            ...node,
            hasChildMindMaps: true,
            childMindMapIds: [...currentChildMindMapIds, newMindMapId],
            // Manter compatibilidade com versão anterior
            hasChildMindMap: true,
            childMindMapId: currentChildMindMapIds.length === 0 ? newMindMapId : node.childMindMapId,
          };
        }
        return node;
      };

      // Atualizar o histórico
      setMindMapHistory(prevHistory => 
        prevHistory.map(mindMap => 
          mindMap.id === currentMindMapId 
            ? {
                ...mindMap,
                nodes: mindMap.nodes.map(node => updateNodeWithChildMindMap(node, newMindMapId))
              }
            : mindMap
        )
      );
      
      // Atualizar os nós atuais
      setNodes(prevNodes => 
        prevNodes.map(node => updateNodeWithChildMindMap(node, newMindMapId))
      );
      
      // Navegar para o novo mapa mental
      setCurrentMindMapId(newMindMapId);
      setNodes(nodes);
      setSelectedNode(null);
      
      // 🔥 AUTO-SAVE: Salvar hierarquia completa após criar mapa a partir de texto
      console.log('🔥 AUTO-SAVE: Salvando hierarquia após criação de mapa a partir de texto...');
      setTimeout(() => {
        console.log('🔥 AUTO-SAVE: Executando salvamento automático da hierarquia...');
        handleSaveMindMap();
      }, 1500); // Delay para garantir que o estado foi atualizado
      
    } catch (error) {
      console.error('Erro ao criar mapa mental:', error);
      alert('Erro ao criar mapa mental: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [currentMindMapId, handleSaveMindMap]);

  const getMindMapsForNode = useCallback((nodeId: string) => {
    const result = mindMapHistory
      .filter(mindMap => mindMap.parentNodeId === nodeId)
      .map(mindMap => ({
        id: mindMap.id,
        title: mindMap.title,
        createdAt: mindMap.createdAt,
        creationMethod: mindMap.creationMethod,
      }));
    
    console.log(`[DEBUG] getMindMapsForNode(${nodeId}):`, result);
    console.log(`[DEBUG] mindMapHistory:`, mindMapHistory);
    
    return result;
  }, [mindMapHistory]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prevNodes => {
      // Função recursiva para coletar todos os nós filhos
      const collectChildren = (parentId: string, allNodes: MindMapNode[]): string[] => {
        const parent = allNodes.find(n => n.id === parentId);
        if (!parent?.children) return [];
        
        const directChildren = parent.children;
        const allChildren = [...directChildren];
        
        // Recursivamente coletar netos, bisnetos, etc.
        directChildren.forEach(childId => {
          allChildren.push(...collectChildren(childId, allNodes));
        });
        
        return allChildren;
      };

      // Coletar todos os IDs para deletar (nó + todos os filhos)
      const idsToDelete = [nodeId, ...collectChildren(nodeId, prevNodes)];
      
      // Filtrar os nós removendo todos os IDs coletados
      const filteredNodes = prevNodes.filter(node => !idsToDelete.includes(node.id));
      
      // Remover referências dos nós pais para os nós deletados
      return filteredNodes.map(node => ({
        ...node,
        children: node.children?.filter(childId => !idsToDelete.includes(childId))
      }));
    });
    
    // Fechar o painel lateral se o nó selecionado foi deletado
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleEditNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    // Atualizar o label do nó nos nodes atuais
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, label: newLabel }
          : node
      )
    );
    
    // Atualizar o label do nó no histórico de mapas mentais
    setMindMapHistory(prevHistory => 
      prevHistory.map(mindMap => 
        mindMap.id === currentMindMapId
          ? {
              ...mindMap,
              nodes: mindMap.nodes.map(node => 
                node.id === nodeId 
                  ? { ...node, label: newLabel }
                  : node
              ),
              // Se for o nó central (level 0), atualizar também o título do mapa
              title: mindMap.nodes.find(n => n.id === nodeId && n.level === 0) 
                ? newLabel 
                : mindMap.title
            }
          : mindMap
      )
    );
  }, [currentMindMapId]);

  const handleNavigateToMindMap = useCallback((mindMapId: string) => {
    const mindMap = mindMapHistory.find(mm => mm.id === mindMapId);
    if (mindMap) {
      setCurrentMindMapId(mindMapId);
      setNodes(mindMap.nodes);
      setSelectedNode(null);
    }
  }, [mindMapHistory]);

  const handleNavigateBack = useCallback(() => {
    const currentMindMap = mindMapHistory.find(mm => mm.id === currentMindMapId);
    if (currentMindMap?.parentMindMapId) {
      handleNavigateToMindMap(currentMindMap.parentMindMapId);
    }
  }, [currentMindMapId, mindMapHistory, handleNavigateToMindMap]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
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
          
          <div className="flex items-center space-x-3">
            {/* Botões de ação */}
            {nodes.length > 0 && (
              <>
                <button
                  onClick={handleSaveMindMap}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  <span>{currentSavedMindMap ? 'Atualizar' : 'Salvar'}</span>
                </button>
                <button
                  onClick={handleCreateNewMindMapFromScratch}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Sparkles size={16} />
                  <span>Novo</span>
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowSavedMindMaps(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <BookOpen size={16} />
              <span>Meus Mapas</span>
            </button>
            
            {/* Área de usuário */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
                  <User size={16} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <User size={16} />
                <span>Entrar</span>
              </button>
            )}
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
          <div className="h-full overflow-y-auto">
            <div className="p-6 min-h-full flex flex-col">
              {/* Tab Navigation */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mb-6 flex-shrink-0">
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
              <div className="flex-1 min-h-0">
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
                      <TextInput 
                        onSubmit={handleTextSubmit} 
                        onItemsSubmit={handleItemsSubmit}
                        isLoading={isLoading} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 relative">
          {nodes.length > 0 ? (
            <MindMapFlow
              key={nodes.find(n => n.level === 0)?.id || 'default'} // Força remontagem do componente
              nodes={nodes}
              onNodeClick={handleNodeClick}
              onExpandNode={handleExpandNode}
              onCreateNewMindMap={handleCreateNewMindMap}
              onCreateMindMapFromPDF={handleCreateMindMapFromPDF}
              onCreateMindMapFromText={handleCreateMindMapFromText}
              onDeleteNode={handleDeleteNode}
              onEditNodeLabel={handleEditNodeLabel}
              onNavigateToMindMap={handleNavigateToMindMap}
              onNavigateBack={handleNavigateBack}
              getMindMapsForNode={getMindMapsForNode}
              mindMapHistory={mindMapHistory}
              currentMindMapId={currentMindMapId}
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
      
      {/* Modais */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <SavedMindMaps
        isOpen={showSavedMindMaps}
        onClose={() => setShowSavedMindMaps(false)}
        onLoadMindMap={handleLoadMindMap}
        onCreateNew={handleCreateNewMindMapFromScratch}
      />
    </div>
  );
};
