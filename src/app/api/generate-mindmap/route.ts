import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MindMapNode } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Função para detectar se o texto está em formato de tópicos
function detectTopicFormat(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Padrões que indicam formato de tópicos
  const topicPatterns = [
    /^\s*\d+\./,           // 1. 2. 3.
    /^\s*\d+\)\s/,         // 1) 2) 3)
    /^\s*[a-zA-Z]\.\s/,    // a. b. c.
    /^\s*[a-zA-Z]\)\s/,    // a) b) c)
    /^\s*[-*+]\s/,         // - * +
    /^\s*#{1,6}\s/,        // # ## ###
    /^\s*\d+\.\d+/,        // 1.1 1.2 2.1
  ];
  
  let topicLines = 0;
  for (const line of lines) {
    if (topicPatterns.some(pattern => pattern.test(line))) {
      topicLines++;
    }
  }
  
  // Se pelo menos 30% das linhas seguem padrão de tópicos
  return (topicLines / lines.length) >= 0.3;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_ai_api_key_here') {
      return NextResponse.json(
        { error: 'Chave da API do Google AI não configurada. Configure GOOGLE_API_KEY no arquivo .env.local' },
        { status: 500 }
      );
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Conteúdo não fornecido' },
        { status: 400 }
      );
    }

    // Truncar texto se muito longo (para evitar limites da API)
    const maxLength = 15000;
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;

    // Detectar se o texto já está em formato de tópicos
    const isTopicFormat = detectTopicFormat(truncatedContent);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    let prompt: string;
    
    if (isTopicFormat) {
      prompt = `O texto fornecido já está em formato de tópicos hierárquicos. Converta EXATAMENTE esta estrutura em um mapa mental, preservando a hierarquia original dos tópicos, o conteúdo exato de cada tópico, a estrutura de níveis, e os títulos e subtítulos como estão.

Texto em formato de tópicos: ${truncatedContent}

Instruções específicas:
1. Use o primeiro tópico principal ou título como nó central (level 0)
2. Mantenha a hierarquia EXATA dos tópicos
3. Preserve o texto original dos tópicos como labels
4. Use cada subtópico como está escrito
5. Mantenha a estrutura pai-filho conforme a indentação/numeração original

Retorne APENAS um JSON válido com array "nodes" contendo objetos com id, label, description, level, x, y, color, children e parent.

Diretrizes importantes:
- Use EXATAMENTE os textos originais como labels, respeitando a hierarquia dada
- Use cores diferentes para cada nível: level 0 #8b5cf6, level 1 #3b82f6, level 2 #10b981, level 3 #f59e0b
- Máximo de 20 nós no total para legibilidade
- Garanta relacionamentos pai-filho adequados
- Os IDs devem ser strings numéricas sequenciais`;
    } else {
      prompt = `Analise o seguinte texto e crie um mapa mental hierárquico e estruturado.

Texto: ${truncatedContent}

Siga estas instruções:
1. Identifique o tópico central principal (level 0)
2. Crie 3-6 ramos principais (level 1) representando os temas-chave
3. Para cada ramo principal, crie 2-4 sub-ramos (level 2) com detalhes específicos
4. Adicione nós folha (level 3+) para exemplos ou detalhes específicos quando relevante

Retorne APENAS um JSON válido com array "nodes" contendo objetos com id, label, description, level, x, y, color, children e parent.

Diretrizes importantes:
- Use rótulos concisos e significativos (máximo 3-4 palavras)
- Forneça descrições educativas e informativas (2-3 frases)
- Use cores diferentes para cada nível: level 0 #8b5cf6, level 1 #3b82f6, level 2 #10b981, level 3 #f59e0b
- Máximo de 20 nós no total para legibilidade
- Garanta relacionamentos pai-filho adequados
- Os IDs devem ser strings numéricas sequenciais
- Cada nó deve ter informações úteis e educativas`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extrair JSON da resposta
    let mindMapData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }
      mindMapData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da IA:', parseError);
      console.error('Resposta recebida:', text);
      return NextResponse.json(
        { error: 'Formato de resposta inválido da IA' },
        { status: 500 }
      );
    }

    // Calcular posições para os nós em layout radial
    const nodes = calculateNodePositions(mindMapData.nodes);

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Erro ao gerar mapa mental:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar o mapa mental' },
      { status: 500 }
    );
  }
}

function calculateNodePositions(nodes: MindMapNode[]): MindMapNode[] {
  const centerNode = nodes.find(node => node.level === 0);
  if (!centerNode) return nodes;

  // Posicionar nó central
  centerNode.x = 0;
  centerNode.y = 0;

  // Obter nós de nível 1 (ramos principais)
  const level1Nodes = nodes.filter(node => node.level === 1);
  const angleStep = (2 * Math.PI) / level1Nodes.length;

  level1Nodes.forEach((node, index) => {
    const angle = index * angleStep;
    const radius = 300;
    node.x = Math.cos(angle) * radius;
    node.y = Math.sin(angle) * radius;

    // Posicionar nós filhos
    if (node.children) {
      const childNodes = nodes.filter(child => node.children?.includes(child.id));
      childNodes.forEach((childNode, childIndex) => {
        const childAngle = angle + (childIndex - (childNodes.length - 1) / 2) * 0.3;
        const childRadius = radius + 150 + (childNode.level - 2) * 100;
        childNode.x = Math.cos(childAngle) * childRadius;
        childNode.y = Math.sin(childAngle) * childRadius;
      });
    }
  });

  return nodes;
}
