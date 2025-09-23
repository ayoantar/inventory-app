'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import PresetTable from '@/components/presets/preset-table'
import PresetFilters from '@/components/presets/preset-filters'
import PresetFormModal from '@/components/presets/preset-form-modal'

interface Preset {
  id: string
  name: string
  description?: string
  category?: string
  department?: string
  isActive: boolean
  isTemplate: boolean
  priority: number
  estimatedDuration?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    id: string
    name?: string
    email?: string
  }
  items?: Array<{
    id: string
    name: string
    quantity: number
    isRequired: boolean
    priority: number
    notes?: string
    category?: string
    assetId?: string
    asset?: {
      id: string
      name: string
      description?: string
      status: string
      assetNumber?: string
      category: string
      manufacturer?: string
      model?: string
    }
  }>
  checkouts?: Array<any>
  _count?: {
    items: number
    checkouts: number
    substitutions: number
  }
}

interface PresetsResponse {
  presets: Preset[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function PresetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    department: '',
    isActive: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchPresets()
  }, [status, router, filters, pagination.page, pagination.limit])

  const fetchPresets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.department && { department: filters.department }),
        ...(filters.isActive && { isActive: filters.isActive })
      })
      
      const response = await fetch(`/api/presets?${params}`)
      if (response.ok) {
        const data: PresetsResponse = await response.json()
        setPresets(data.presets)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePresetUpdate = (updatedPreset: Preset) => {
    setPresets(prev => prev.map(preset => 
      preset.id === updatedPreset.id ? updatedPreset : preset
    ))
  }

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleDeletePreset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return
    
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchPresets() // Refresh the list
      } else {
        alert('Failed to delete preset')
      }
    } catch (error) {
      console.error('Failed to delete preset:', error)
      alert('Failed to delete preset')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        fetchPresets() // Refresh the list
      } else {
        alert('Failed to update preset')
      }
    } catch (error) {
      console.error('Failed to update preset:', error)
      alert('Failed to update preset')
    }
  }

  const handleFormSuccess = () => {
    fetchPresets() // Refresh the list
  }

  const handleFormClose = () => {
    setShowFormModal(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-brand-secondary-text bg-clip-text text-transparent">
                  Equipment Presets
                </h1>
              </div>
              <p className="text-gray-600 dark:text-brand-secondary-text ml-11 max-w-2xl">
                Manage reusable equipment sets for streamlined checkouts
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFormModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Preset
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <PresetFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Results Summary & Pagination */}
        {!loading && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} presets
            </div>
            
            {/* Pagination */}
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-brand-dark-blue-deep rounded-lg hover:bg-white/10 dark:hover:bg-white/10 bg-gray-900/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm border border-gray-300 dark:border-brand-dark-blue-deep rounded-lg bg-gray-900/5 text-gray-700 dark:text-brand-secondary-text">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-brand-dark-blue-deep rounded-lg hover:bg-white/10 dark:hover:bg-white/10 bg-gray-900/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && presets.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg className="w-12 h-12 text-purple-400 dark:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-brand-secondary-text bg-clip-text text-transparent mb-3">
              No presets found
            </h3>
            <p className="text-gray-600 dark:text-brand-secondary-text max-w-sm mx-auto leading-relaxed mb-6">
              {filters.search || filters.category || filters.department || filters.isActive 
                ? 'Try adjusting your filters to see more results.'
                : 'Create your first equipment preset to streamline checkout workflows.'
              }
            </p>
            {!filters.search && !filters.category && !filters.department && !filters.isActive && (
              <button
                onClick={() => setShowFormModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Preset
              </button>
            )}
          </div>
        )}

        {/* Presets Table */}
        {!loading && presets.length > 0 && (
          <PresetTable
            presets={presets}
            onDelete={handleDeletePreset}
            onToggleActive={handleToggleActive}
            onUpdate={handlePresetUpdate}
          />
        )}
      </div>

      {/* Preset Form Modal */}
      <PresetFormModal
        isOpen={showFormModal}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}