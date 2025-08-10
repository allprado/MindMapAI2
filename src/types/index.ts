export interface MindMapNode {
  id: string;
  label: string;
  description: string;
  level: number;
  x: number;
  y: number;
  color: string;
  children?: string[];
  parent?: string;
  hasChildMindMaps?: boolean; // Indica se foram criados mapas mentais a partir deste nó
  childMindMapIds?: string[]; // IDs dos mapas mentais filhos
  // Manter compatibilidade com versão anterior
  hasChildMindMap?: boolean;
  childMindMapId?: string;
}

export interface MindMapHistory {
  id: string;
  parentNodeId?: string; // ID do nó pai de onde este mapa foi criado
  parentMindMapId?: string; // ID do mapa mental pai
  nodes: MindMapNode[];
  title: string;
  createdAt: Date;
  creationMethod?: 'auto' | 'pdf' | 'text' | 'items'; // Método de criação
}

export interface MindMapSelection {
  id: string;
  title: string;
  createdAt: Date;
  creationMethod?: 'auto' | 'pdf' | 'text' | 'items';
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface AIResponse {
  text: string;
  suggestions?: string[];
}
