import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    return null
  }
  
  return user
}

interface Props {
  params: { id: string }
}

// POST - Duplicar mapa mental
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = params
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    // Buscar o mapa original
    const { data: originalMindMap, error: fetchError } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !originalMindMap) {
      return NextResponse.json({ error: 'Mapa mental não encontrado' }, { status: 404 })
    }

    // Criar a duplicata
    const { data: duplicatedMindMap, error: createError } = await supabaseAdmin
      .from('mindmaps')
      .insert({
        title: title || `${originalMindMap.title} (Cópia)`,
        description: originalMindMap.description,
        nodes: originalMindMap.nodes,
        edges: originalMindMap.edges || [],
        user_id: user.id,
        is_public: false, // Sempre criar cópias como privadas
        tags: originalMindMap.tags || []
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    return NextResponse.json(duplicatedMindMap, { status: 201 })
  } catch (error) {
    console.error('Erro ao duplicar mapa mental:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
