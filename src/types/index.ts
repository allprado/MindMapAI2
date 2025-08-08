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
