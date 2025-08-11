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
  params: Promise<{ id: string }>
}

// GET - Obter mapa mental específico
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params

    const { data: mindmap, error } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!mindmap) {
      return NextResponse.json(
        { error: 'Mapa mental não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(mindmap)
  } catch (error) {
    console.error('Erro ao buscar mapa mental:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar mapa mental
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = (await params)
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, nodes, edges, isPublic, tags } = body

    const { data: mindmap, error } = await supabaseAdmin
      .from('mindmaps')
      .update({
        title,
        description,
        nodes,
        edges,
        is_public: isPublic,
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Garantir que o usuário só pode atualizar seus próprios mapas
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(mindmap)
  } catch (error) {
    console.error('Erro ao atualizar mapa mental:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir mapa mental
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = (await params)
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('mindmaps')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Garantir que o usuário só pode excluir seus próprios mapas

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Mapa mental excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir mapa mental:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
