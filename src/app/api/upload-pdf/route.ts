import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MindMapNode } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_ai_api_key_here') {
      return NextResponse.json(
        { error: 'Chave da API do Google AI não configurada. Configure GOOGLE_API_KEY no arquivo .env.local' },
        { status: 500 }
      );
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são suportados' },
        { status: 400 }
      );
    }

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Preparar o arquivo para o Gemini
    const filePart = {
      inlineData: {
        data: base64,
        mimeType: 'application/pdf'
      }
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
    Analise este documento PDF e crie um mapa mental hierárquico e estruturado. 
    
    Siga estas instruções:
    1. Identifique o tópico central principal (level 0)
    2. Crie 3-6 ramos principais (level 1) representando os temas-chave
    3. Para cada ramo principal, crie 2-4 sub-ramos (level 2) com detalhes específicos
    4. Adicione nós folha (level 3+) para exemplos ou detalhes específicos quando relevante

    Retorne APENAS um JSON válido no seguinte formato:
    {
      "nodes": [
        {
          "id": "1",
          "label": "Tópico Principal",
          "description": "Descrição detalhada do tópico (2-3 frases educativas)",
          "level": 0,
          "x": 0,
          "y": 0,
          "color": "#8b5cf6",
          "children": ["2", "3", "4"]
        },
        {
          "id": "2",
          "label": "Subtópico 1",
          "description": "Explicação detalhada do primeiro subtópico",
          "level": 1,
          "x": 300,
          "y": -100,
          "color": "#3b82f6",
          "children": ["5", "6"],
          "parent": "1"
        }
      ]
    }

    Diretrizes importantes:
    - Use rótulos concisos e significativos (máximo 3-4 palavras)
    - Forneça descrições educativas e informativas
    - Use cores diferentes para cada nível: level 0 (#8b5cf6), level 1 (#3b82f6), level 2 (#10b981), level 3 (#f59e0b)
    - Máximo de 20 nós no total para legibilidade
    - Garanta relacionamentos pai-filho adequados
    - Os IDs devem ser strings numéricas sequenciais
    `;

    const result = await model.generateContent([prompt, filePart]);
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
    console.error('Erro ao processar PDF:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o arquivo PDF' },
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
