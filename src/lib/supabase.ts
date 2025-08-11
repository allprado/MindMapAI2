import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      mindmaps: {
        Row: {
          id: string
          title: string
          description: string | null
          nodes: any[]
          edges: any[] | null
          created_at: string
          updated_at: string
          user_id: string
          is_public: boolean
          tags: string[] | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          nodes: any[]
          edges?: any[] | null
          created_at?: string
          updated_at?: string
          user_id: string
          is_public?: boolean
          tags?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          nodes?: any[]
          edges?: any[] | null
          created_at?: string
          updated_at?: string
          user_id?: string
          is_public?: boolean
          tags?: string[] | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type MindMap = Database['public']['Tables']['mindmaps']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
