import { supabase, type MindMap } from '@/lib/supabase'
import { MindMapNode } from '@/types'

export interface CreateMindMapData {
  title: string
  description?: string
  nodes: MindMapNode[]
  edges?: any[]
  isPublic?: boolean
  tags?: string[]
}

export interface UpdateMindMapData {
  title?: string
  description?: string
  nodes?: MindMapNode[]
  edges?: any[]
  isPublic?: boolean
  tags?: string[]
}

export class MindMapService {
  static async createMindMap(data: CreateMindMapData): Promise<{ data: MindMap | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: new Error('Usuário não autenticado') }
    }

    const { data: mindmap, error } = await supabase
      .from('mindmaps')
      .insert({
        title: data.title,
        description: data.description,
        nodes: data.nodes,
        edges: data.edges || [],
        user_id: user.id,
        is_public: data.isPublic || false,
        tags: data.tags || []
      })
      .select()
      .single()

    return { data: mindmap, error }
  }

  static async updateMindMap(id: string, data: UpdateMindMapData): Promise<{ data: MindMap | null; error: any }> {
    const { data: mindmap, error } = await supabase
      .from('mindmaps')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    return { data: mindmap, error }
  }

  static async deleteMindMap(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('mindmaps')
      .delete()
      .eq('id', id)

    return { error }
  }

  static async getMindMap(id: string): Promise<{ data: MindMap | null; error: any }> {
    const { data: mindmap, error } = await supabase
      .from('mindmaps')
      .select('*')
      .eq('id', id)
      .single()

    return { data: mindmap, error }
  }

  static async getUserMindMaps(): Promise<{ data: MindMap[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: new Error('Usuário não autenticado') }
    }

    const { data: mindmaps, error } = await supabase
      .from('mindmaps')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    return { data: mindmaps, error }
  }

  static async getPublicMindMaps(): Promise<{ data: MindMap[] | null; error: any }> {
    const { data: mindmaps, error } = await supabase
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

    return { data: mindmaps, error }
  }

  static async searchMindMaps(query: string): Promise<{ data: MindMap[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser()
    
    let queryBuilder = supabase
      .from('mindmaps')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false })

    // Se o usuário estiver autenticado, incluir seus mapas privados
    if (user) {
      queryBuilder = queryBuilder.or(`user_id.eq.${user.id},is_public.eq.true`)
    } else {
      queryBuilder = queryBuilder.eq('is_public', true)
    }

    const { data: mindmaps, error } = await queryBuilder

    return { data: mindmaps, error }
  }

  static async duplicateMindMap(id: string, newTitle?: string): Promise<{ data: MindMap | null; error: any }> {
    const { data: originalMindMap, error: fetchError } = await this.getMindMap(id)
    
    if (fetchError || !originalMindMap) {
      return { data: null, error: fetchError || new Error('Mapa mental não encontrado') }
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: new Error('Usuário não autenticado') }
    }

    const duplicatedData: CreateMindMapData = {
      title: newTitle || `${originalMindMap.title} (Cópia)`,
      description: originalMindMap.description || undefined,
      nodes: originalMindMap.nodes,
      edges: originalMindMap.edges || [],
      isPublic: false, // Sempre criar cópias como privadas
      tags: originalMindMap.tags || []
    }

    return this.createMindMap(duplicatedData)
  }
}
