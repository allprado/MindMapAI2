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

    const { content, expandNode, parentNodeId, newMindMap } = await request.json();

    console.log('=== INÍCIO DA ANÁLISE ===');
    console.log('API chamada com:', { content, expandNode, parentNodeId, newMindMap });
    console.log('Tipo de geração:', {
      isExpansion: !!(expandNode && parentNodeId),
      isNewMindMap: !!newMindMap,
      isFirstGeneration: !expandNode && !newMindMap
    });

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    let prompt: string;
    
    if (expandNode && parentNodeId) {
      console.log('🔄 CONDIÇÃO: Expansão de nó');
      // Prompt para expandir um nó específico
      prompt = `Expanda o seguinte tópico criando 3-5 subnós detalhados e informativos:

Tópico para expandir: ${truncatedContent}

Instruções específicas:
1. Crie APENAS os novos nós filhos (level atual + 1)
2. Cada subnó deve ter um label conciso (2-3 palavras) e uma description educativa
3. Use cores apropriadas: level 2 #10b981, level 3 #f59e0b, level 4 #ef4444, level 5+ #ec4899
4. Os IDs dos novos nós devem ser únicos (use timestamp + índice)
5. Cada nó filho deve ter parent: "${parentNodeId}"
6. Use posições temporárias (x: 0, y: 0) pois serão recalculadas

Retorne APENAS um JSON válido com array "nodes" contendo SOMENTE os novos nós filhos.

Exemplo de estrutura:
{
  "nodes": [
    {
      "id": "exp_1",
      "label": "Subnó 1",
      "description": "Descrição detalhada do subnó 1...",
      "level": 3,
      "x": 0,
      "y": 0,
      "color": "#f59e0b",
      "parent": "${parentNodeId}",
      "children": []
    }
  ]
}`;
    } else if (newMindMap) {
      console.log('🆕 CONDIÇÃO: Novo mapa mental (com flag newMindMap)');
      // Prompt para criar um novo mapa mental completo e detalhado
      prompt = `Crie um mapa mental MUITO DETALHADO e completo sobre o seguinte tópico:

Tópico: ${truncatedContent}

Instruções específicas para criar um mapa mental rico em detalhes:

1. Use o tópico como nó central (level 0) com description abrangente
2. Crie 6-8 ramos principais (level 1) cobrindo TODOS os aspectos fundamentais do tópico:
   - Conceitos e definições básicas
   - História e evolução
   - Tipos e classificações
   - Principais áreas/componentes/ramos
   - Aplicações práticas
   - Metodologias e técnicas
   - Impactos e consequências
   - Futuro e tendências
   - Ética e considerações sociais (quando aplicável)

3. Para cada ramo principal (level 1), crie 3-5 sub-ramos (level 2) com:
   - Subtópicos específicos e relevantes
   - Conceitos-chave dentro da área
   - Metodologias ou abordagens específicas
   - Exemplos práticos importantes

4. Para sub-ramos importantes (level 2), adicione nós filhos (level 3) com:
   - Detalhes técnicos específicos
   - Exemplos concretos
   - Casos de uso
   - Ferramentas ou tecnologias específicas
   - Características distintivas

5. Quando relevante, adicione um quarto nível (level 4) para:
   - Exemplos muito específicos
   - Detalhes técnicos avançados
   - Casos práticos

EXEMPLO DE ESTRUTURA DETALHADA:

Para "Inteligência Artificial", crie ramos como:
- "Conceitos Básicos" → "Definição de IA", "História", "Tipos de IA", "Objetivos"
- "Ramos da IA" → "Machine Learning", "Deep Learning", "NLP", "Visão Computacional", "Robótica"
- "Machine Learning" → "Supervisionado", "Não Supervisionado", "Reforço", "Algoritmos"
- "Aplicações" → "Saúde", "Finanças", "Transporte", "Marketing", "Segurança"
- "Ética e Impactos" → "Privacidade", "Viés Algorítmico", "Mercado de Trabalho", "Regulação"
- "Tecnologias" → "Python", "TensorFlow", "PyTorch", "Big Data"
- "Futuro" → "IA Geral", "Singularidade", "Tendências"

Retorne APENAS um JSON válido com array "nodes" contendo objetos com id, label, description, level, x, y, color, children e parent.

Diretrizes rigorosas:
- Use rótulos precisos e informativos (máximo 4-5 palavras)
- Forneça descriptions RICAS e educativas (3-5 frases explicativas)
- Use cores: level 0 #8b5cf6, level 1 #3b82f6, level 2 #10b981, level 3 #f59e0b, level 4 #ef4444
- Crie 35-50 nós no total para máximo detalhamento
- Garanta hierarquia clara e relacionamentos corretos
- IDs sequenciais numéricos como strings
- Cada description deve ser informativa e educativa, não apenas repetir o label`;
    } else {
      console.log('🥇 CONDIÇÃO: Primeira geração (sem flags especiais)');
      // Detectar se o texto já está em formato de tópicos
      const isTopicFormat = detectTopicFormat(truncatedContent);
      
      if (isTopicFormat) {
        console.log('📋 SUBCONDIÇÃO: Formato de tópicos detectado');
        prompt = `O texto fornecido já está em formato de tópicos hierárquicos. Converta esta estrutura em um mapa mental DETALHADO, preservando a hierarquia original e EXPANDINDO com informações educativas.

Texto em formato de tópicos: ${truncatedContent}

Instruções específicas:
1. Use o primeiro tópico principal ou título como nó central (level 0)
2. Mantenha a hierarquia EXATA dos tópicos originais
3. Preserve o texto original dos tópicos como labels
4. Para cada tópico, crie descriptions RICAS e educativas (3-5 frases) que:
   - Expliquem o conceito em detalhes
   - Forneçam contexto adicional
   - Incluam exemplos ou aplicações práticas
   - Adicionem valor educativo além do label
5. Mantenha a estrutura pai-filho conforme a indentação/numeração original
6. Se possível, adicione subtópicos educativos adicionais quando apropriado

IMPORTANTE: Mesmo preservando a estrutura original, as descriptions devem ser MUITO informativas e educativas.

Retorne APENAS um JSON válido com array "nodes" contendo objetos com id, label, description, level, x, y, color, children e parent.

Diretrizes importantes:
- Use EXATAMENTE os textos originais como labels, respeitando a hierarquia
- Forneça descriptions RICAS e educativas (3-5 frases explicativas)
- Use cores: level 0 #8b5cf6, level 1 #3b82f6, level 2 #10b981, level 3 #f59e0b, level 4 #ef4444
- Mínimo de 25-35 nós para máximo detalhamento
- Garanta relacionamentos pai-filho adequados
- IDs sequenciais numéricos como strings
- Descriptions devem ser informativas e educativas, agregando valor real`;
      } else {
        console.log('📝 SUBCONDIÇÃO: Texto livre detectado');
        prompt = `Analise profundamente o seguinte texto e crie um mapa mental MUITO DETALHADO e estruturado.

Texto: ${truncatedContent}

Instruções para análise profunda e criação detalhada:

1. Identifique o tópico central principal (level 0) e forneça description abrangente
2. Analise o texto para extrair 6-8 ramos principais (level 1) que representem:
   - Conceitos fundamentais mencionados
   - Temas principais abordados
   - Categorias ou classificações presentes
   - Processos ou metodologias descritos
   - Aplicações ou exemplos citados
   - Causas e consequências mencionadas
   - Aspectos teóricos e práticos
   - Implicações ou impactos discutidos

3. Para cada ramo principal (level 1), crie 3-5 sub-ramos (level 2) extraindo:
   - Subtópicos específicos do texto
   - Detalhes importantes mencionados
   - Exemplos concretos citados
   - Características ou propriedades descritas
   - Métodos ou técnicas explicados

4. Para sub-ramos relevantes (level 2), adicione nós filhos (level 3) com:
   - Detalhes específicos do texto
   - Exemplos práticos mencionados
   - Dados ou estatísticas citados
   - Casos específicos descritos
   - Ferramentas ou recursos mencionados

5. Quando o texto permitir, adicione level 4 para:
   - Detalhes muito específicos
   - Exemplos concretos únicos
   - Aspectos técnicos avançados

ESTRATÉGIA DE EXTRAÇÃO:
- Leia CUIDADOSAMENTE todo o texto
- Identifique palavras-chave e conceitos principais
- Extraia informações implícitas e explícitas
- Organize em hierarquia lógica e educativa
- Mantenha fidelidade ao conteúdo original
- Adicione contexto educativo nas descriptions

Retorne APENAS um JSON válido com array "nodes" contendo objetos com id, label, description, level, x, y, color, children e parent.

Diretrizes rigorosas:
- Use rótulos precisos baseados no texto (máximo 4-5 palavras)
- Forneça descriptions EDUCATIVAS e detalhadas (3-5 frases)
- Use cores: level 0 #8b5cf6, level 1 #3b82f6, level 2 #10b981, level 3 #f59e0b, level 4 #ef4444
- Crie 30-45 nós para máximo aproveitamento do conteúdo
- Garanta hierarquia lógica baseada no texto
- IDs sequenciais numéricos como strings
- Descriptions devem agregar valor educativo, não apenas repetir labels`;
      }
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Resposta da IA:', text);

    // Extrair JSON da resposta
    let mindMapData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }
      mindMapData = JSON.parse(jsonMatch[0]);
      console.log('Dados parseados:', mindMapData);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da IA:', parseError);
      console.error('Resposta recebida:', text);
      return NextResponse.json(
        { error: 'Formato de resposta inválido da IA' },
        { status: 500 }
      );
    }

    // Calcular posições para os nós em layout radial
    let nodes;
    if (expandNode) {
      console.log('🔄 PROCESSAMENTO: Expansão de nó');
      // Para expansão de nós, não recalcular posições, apenas usar as fornecidas pela IA
      nodes = mindMapData.nodes;
      
      // Garantir IDs únicos para expansão
      const timestamp = Date.now();
      nodes = nodes.map((node: any, index: number) => ({
        ...node,
        id: `${parentNodeId}_${timestamp}_${index + 1}`, // ID único baseado no parent + timestamp + índice
        parent: parentNodeId // Garantir que o parent está correto
      }));
      
      console.log('Nós para expansão com IDs únicos:', nodes);
    } else {
      console.log('🏗️ PROCESSAMENTO: Criação de mapa mental completo');
      console.log('📊 DADOS BRUTOS DA IA:', JSON.stringify(mindMapData.nodes, null, 2));
      
      // Para novos mapas mentais (tanto primeiro quanto criados a partir de nós), 
      // corrigir estrutura hierárquica e não aplicar posições - deixar o Dagre fazer isso no frontend
      let processedNodes = mindMapData.nodes.map((node: any) => ({
        ...node,
        x: 0, // Posições temporárias
        y: 0  // Serão recalculadas pelo Dagre
      }));
      
      // Corrigir estrutura hierárquica para garantir que Dagre funcione corretamente
      processedNodes = fixHierarchicalStructure(processedNodes);
      nodes = processedNodes;
      
      if (newMindMap) {
        console.log('🆕 Novo mapa mental criado a partir de nó com estrutura hierárquica corrigida');
      } else {
        console.log('🥇 Primeira geração com estrutura hierárquica corrigida');
      }
    }

    console.log('Retornando nós:', nodes);
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

// Função para garantir que a estrutura hierárquica está correta
function fixHierarchicalStructure(nodes: MindMapNode[]): MindMapNode[] {
  console.log('Verificando estrutura hierárquica para', nodes.length, 'nós');
  
  // Organizar nós por nível para criar uma hierarquia limpa
  const nodesByLevel = new Map<number, MindMapNode[]>();
  nodes.forEach(node => {
    const level = node.level;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });

  // Limpar todos os relacionamentos existentes
  nodes.forEach(node => {
    node.children = [];
    node.parent = undefined;
  });

  // Garantir que temos apenas um nó central (level 0)
  const level0Nodes = nodesByLevel.get(0) || [];
  if (level0Nodes.length === 0) {
    console.error('❌ Nenhum nó central encontrado!');
    return nodes;
  }
  
  // Se há múltiplos nós level 0, usar apenas o primeiro
  const centralNode = level0Nodes[0];
  if (level0Nodes.length > 1) {
    console.log('⚠️ Múltiplos nós centrais encontrados, usando apenas o primeiro');
    // Converter os extras para level 1
    for (let i = 1; i < level0Nodes.length; i++) {
      level0Nodes[i].level = 1;
      const level1Nodes = nodesByLevel.get(1) || [];
      level1Nodes.push(level0Nodes[i]);
      nodesByLevel.set(1, level1Nodes);
    }
  }

  console.log(`Nó central: ${centralNode.id} - ${centralNode.label}`);

  // Reconstruir hierarquia de forma simples e linear
  for (let level = 1; level <= Math.max(...nodes.map(n => n.level)); level++) {
    const currentLevelNodes = nodesByLevel.get(level) || [];
    const parentLevelNodes = nodesByLevel.get(level - 1) || [];

    if (parentLevelNodes.length === 0 || currentLevelNodes.length === 0) continue;

    console.log(`Conectando ${currentLevelNodes.length} nós do nível ${level} a ${parentLevelNodes.length} pais do nível ${level - 1}`);

    // Distribuir filhos de forma equilibrada entre os pais
    currentLevelNodes.forEach((childNode, index) => {
      const parentIndex = index % parentLevelNodes.length;
      const parentNode = parentLevelNodes[parentIndex];
      
      // Estabelecer relacionamento
      childNode.parent = parentNode.id;
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(childNode.id);
      
      console.log(`  ${childNode.id} -> conectado ao pai ${parentNode.id}`);
    });
  }

  // Verificar estrutura final
  console.log('=== ESTRUTURA FINAL ===');
  nodes.forEach(node => {
    console.log(`${node.id} (${node.label}) - Level: ${node.level} | Parent: ${node.parent || 'nenhum'} | Children: [${node.children?.join(', ') || 'nenhum'}]`);
  });

  return nodes;
}
