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
    Analise PROFUNDAMENTE este documento PDF e crie um mapa mental MUITO DETALHADO e estruturado com base em seu conteúdo.
    
    Instruções para análise profunda do PDF e criação detalhada:

    1. Identifique o tópico central principal (level 0) com description abrangente
    2. Analise TODO o conteúdo do PDF para extrair 6-8 ramos principais (level 1) que representem:
       - Conceitos fundamentais apresentados no documento
       - Temas principais abordados
       - Categorias ou classificações descritas
       - Processos ou metodologias explicados
       - Aplicações ou exemplos citados no PDF
       - Teorias e princípios apresentados
       - Aspectos práticos e teóricos
       - Implicações ou consequências discutidas

    3. Para cada ramo principal (level 1), crie 3-5 sub-ramos (level 2) extraindo:
       - Subtópicos específicos do documento
       - Detalhes importantes mencionados
       - Exemplos concretos citados no PDF
       - Características ou propriedades descritas
       - Métodos ou técnicas explicados no documento

    4. Para sub-ramos relevantes (level 2), adicione nós filhos (level 3) com:
       - Detalhes específicos extraídos do PDF
       - Exemplos práticos mencionados no documento
       - Dados ou estatísticas citados
       - Casos específicos descritos
       - Ferramentas ou recursos mencionados

    5. Quando o conteúdo do PDF permitir, adicione level 4 para:
       - Detalhes muito específicos
       - Exemplos concretos únicos do documento
       - Aspectos técnicos avançados mencionados

    ESTRATÉGIA DE EXTRAÇÃO DO PDF:
    - Leia CUIDADOSAMENTE todo o conteúdo do documento
    - Identifique palavras-chave e conceitos principais presentes no PDF
    - Extraia informações explícitas e implícitas do texto
    - Organize em hierarquia lógica e educativa
    - Mantenha fidelidade absoluta ao conteúdo do documento
    - Adicione contexto educativo nas descriptions baseado no PDF

    Retorne APENAS um JSON válido no seguinte formato:
    {
      "nodes": [
        {
          "id": "1",
          "label": "Tópico Principal do PDF",
          "description": "Descrição abrangente baseada no conteúdo do documento (3-5 frases educativas)",
          "level": 0,
          "x": 0,
          "y": 0,
          "color": "#8b5cf6",
          "children": ["2", "3", "4", "5", "6", "7", "8", "9"]
        },
        {
          "id": "2",
          "label": "Ramo Principal 1",
          "description": "Explicação detalhada extraída do PDF (3-5 frases informativas)",
          "level": 1,
          "x": 0,
          "y": 0,
          "color": "#3b82f6",
          "children": ["10", "11", "12", "13"],
          "parent": "1"
        }
      ]
    }

    Diretrizes rigorosas:
    - Use rótulos precisos baseados no conteúdo do PDF (máximo 4-5 palavras)
    - Forneça descriptions EDUCATIVAS e detalhadas extraídas do documento (3-5 frases)
    - Use cores: level 0 #8b5cf6, level 1 #3b82f6, level 2 #10b981, level 3 #f59e0b, level 4 #ef4444
    - Crie 35-50 nós para máximo aproveitamento do conteúdo do PDF
    - Garanta hierarquia lógica baseada no documento
    - IDs sequenciais numéricos como strings
    - Descriptions devem ser baseadas no conteúdo real do PDF e agregar valor educativo
    - Mantenha fidelidade absoluta ao conteúdo do documento
    - Extraia o máximo de informações úteis e educativas do PDF
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

    // Para PDFs, não calcular posições - deixar o Dagre fazer isso no frontend
    const nodes = mindMapData.nodes.map((node: any) => ({
      ...node,
      x: 0, // Posições temporárias
      y: 0  // Serão recalculadas pelo Dagre
    }));

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o arquivo PDF' },
      { status: 500 }
    );
  }
}
