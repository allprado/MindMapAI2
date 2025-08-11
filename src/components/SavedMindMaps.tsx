'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Share2, 
  Copy, 
  Trash2, 
  Edit3,
  Eye,
  Lock,
  Globe,
  Calendar,
  User,
  X
} from 'lucide-react'
import { MindMap } from '@/lib/supabase'

interface SavedMindMapsProps {
  isOpen: boolean
  onClose: () => void
  onLoadMindMap: (mindMap: MindMap) => void
  onCreateNew: () => void
}

export function SavedMindMaps({ isOpen, onClose, onLoadMindMap, onCreateNew }: SavedMindMapsProps) {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([])
  const [filteredMindMaps, setFilteredMindMaps] = useState<MindMap[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'private' | 'public'>('all')
  const [selectedMindMap, setSelectedMindMap] = useState<MindMap | null>(null)
  const [showPublicMindMaps, setShowPublicMindMaps] = useState(false)

  const { user } = useAuth()

  // Helper function to get headers with authentication
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    return headers
  }

  useEffect(() => {
    if (isOpen && user) {
      loadMindMaps()
    }
  }, [isOpen, user, showPublicMindMaps])

  useEffect(() => {
    filterMindMaps()
  }, [mindMaps, searchQuery, filterType])

  const loadMindMaps = async () => {
    setLoading(true)
    try {
      const endpoint = showPublicMindMaps 
        ? '/api/mindmaps?public=true'
        : '/api/mindmaps'
      
      const headers = await getAuthHeaders()
      const response = await fetch(endpoint, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setMindMaps(data || [])
      } else {
        console.error('Erro ao carregar mapas:', response.statusText)
      }
    } catch (error) {
      console.error('Erro ao carregar mapas mentais:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMindMaps = () => {
    let filtered = mindMaps

    // Filtrar por texto de busca
    if (searchQuery) {
      filtered = filtered.filter(mindMap =>
        mindMap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mindMap.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mindMap.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filtrar por tipo
    if (filterType === 'private') {
      filtered = filtered.filter(mindMap => !mindMap.is_public)
    } else if (filterType === 'public') {
      filtered = filtered.filter(mindMap => mindMap.is_public)
    }

    setFilteredMindMaps(filtered)
  }

  const handleDeleteMindMap = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este mapa mental?')) {
      return
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: 'DELETE',
        headers
      })
      
      if (response.ok) {
        setMindMaps(mindMaps.filter(m => m.id !== id))
      } else {
        alert('Erro ao excluir mapa mental')
      }
    } catch (error) {
      console.error('Erro ao excluir mapa mental:', error)
      alert('Erro ao excluir mapa mental')
    }
  }

  const handleDuplicateMindMap = async (mindMap: MindMap) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/mindmaps/${mindMap.id}/duplicate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `${mindMap.title} (Cópia)`
        })
      })
      
      if (response.ok) {
        const duplicated = await response.json()
        setMindMaps([duplicated, ...mindMaps])
      } else {
        alert('Erro ao duplicar mapa mental')
      }
    } catch (error) {
      console.error('Erro ao duplicar mapa mental:', error)
      alert('Erro ao duplicar mapa mental')
    }
  }

  const handleToggleVisibility = async (mindMap: MindMap) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/mindmaps/${mindMap.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          is_public: !mindMap.is_public
        })
      })
      
      if (response.ok) {
        const updated = await response.json()
        setMindMaps(mindMaps.map(m => m.id === mindMap.id ? updated : m))
      } else {
        alert('Erro ao alterar visibilidade')
      }
    } catch (error) {
      console.error('Erro ao alterar visibilidade:', error)
      alert('Erro ao alterar visibilidade')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl w-full max-w-6xl h-5/6 mx-4 relative flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <BookOpen className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">
              {showPublicMindMaps ? 'Mapas Públicos' : 'Meus Mapas Mentais'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 p-6 border-b">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPublicMindMaps(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !showPublicMindMaps
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Meus Mapas
            </button>
            <button
              onClick={() => setShowPublicMindMaps(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showPublicMindMaps
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mapas Públicos
            </button>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar mapas mentais..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!showPublicMindMaps && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'private' | 'public')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="private">Privados</option>
              <option value="public">Públicos</option>
            </select>
          )}

          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Mapa</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMindMaps.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                {searchQuery 
                  ? 'Nenhum mapa encontrado'
                  : showPublicMindMaps
                    ? 'Nenhum mapa público disponível'
                    : 'Nenhum mapa mental salvo'
                }
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Tente uma busca diferente'
                  : showPublicMindMaps
                    ? 'Não há mapas públicos para visualizar'
                    : 'Crie seu primeiro mapa mental!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMindMaps.map((mindMap) => (
                <motion.div
                  key={mindMap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedMindMap(mindMap)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {mindMap.title}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      {mindMap.is_public ? (
                        <Globe className="text-green-600" size={16} />
                      ) : (
                        <Lock className="text-gray-400" size={16} />
                      )}
                    </div>
                  </div>

                  {mindMap.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {mindMap.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{formatDate(mindMap.updated_at)}</span>
                    </div>
                    <span>{mindMap.nodes.length} nós</span>
                  </div>

                  {mindMap.tags && mindMap.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mindMap.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {mindMap.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{mindMap.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onLoadMindMap(mindMap)
                        onClose()
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Eye size={14} />
                      <span>Abrir</span>
                    </button>

                    {!showPublicMindMaps && user && mindMap.user_id === user.id && (
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleVisibility(mindMap)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title={mindMap.is_public ? 'Tornar privado' : 'Tornar público'}
                        >
                          <Share2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateMindMap(mindMap)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMindMap(mindMap.id)
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}

                    {showPublicMindMaps && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicateMindMap(mindMap)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Fazer uma cópia"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
