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

// GET - Listar mapas mentais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('search')
    const publicOnly = searchParams.get('public') === 'true'

    if (publicOnly) {
      const { data: mindmaps, error } = await supabaseAdmin
        .from('mindmaps')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json(mindmaps)
    }

    if (query) {
      // Para busca, permitir tanto mapas públicos quanto do usuário autenticado
      const user = await getUserFromRequest(request)
      
      let queryBuilder = supabaseAdmin
        .from('mindmaps')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })

      if (user) {
        queryBuilder = queryBuilder.or(`user_id.eq.${user.id},is_public.eq.true`)
      } else {
        queryBuilder = queryBuilder.eq('is_public', true)
      }

      const { data: mindmaps, error } = await queryBuilder
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json(mindmaps)
    }

    // Buscar mapas do usuário autenticado
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { data: mindmaps, error } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(mindmaps)
  } catch (error) {
    console.error('Erro ao buscar mapas mentais:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo mapa mental
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, nodes, edges, isPublic, tags } = body

    if (!title || !nodes) {
      return NextResponse.json(
        { error: 'Título e nodes são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: mindmap, error } = await supabaseAdmin
      .from('mindmaps')
      .insert({
        title,
        description,
        nodes,
        edges: edges || [],
        user_id: user.id,
        is_public: isPublic || false,
        tags: tags || []
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(mindmap, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mapa mental:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
