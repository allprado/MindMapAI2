import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
    You are an expert educational assistant helping a user understand a specific topic from a mind map.

    Context:
    - Topic: ${context.nodeLabel}
    - Description: ${context.nodeDescription}
    - Level: ${context.level}

    User Question: ${message}

    Please provide a helpful, educational response that:
    1. Directly addresses the user's question
    2. Is educational and informative
    3. Uses clear, accessible language
    4. Provides specific examples when appropriate
    5. Relates the answer back to the topic: "${context.nodeLabel}"
    6. Keeps the response concise but comprehensive (2-4 paragraphs maximum)

    Respond in Portuguese (Brazilian).
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
