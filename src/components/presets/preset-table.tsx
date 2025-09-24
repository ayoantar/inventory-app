import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import PresetEditModal from './preset-edit-modal'

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

interface PresetTableProps {
  presets: Preset[]
  onDelete: (presetId: string) => void
  onToggleActive: (presetId: string, isActive: boolean) => void
  onUpdate: (updatedPreset: Preset) => void
}

const categoryColors = {
  'Camera Kit': 'bg-blue-100 text-blue-800',
  'Audio Setup': 'bg-green-100 text-green-800',
  'Lighting Kit': 'bg-yellow-100 text-yellow-800',
  'Conference Setup': 'bg-purple-100 text-purple-800',
  'Video Production': 'bg-red-100 text-red-800',
}

const getCategoryColor = (category?: string) => {
  if (!category) return 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
  return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
}

export default function PresetTable({ presets, onDelete, onToggleActive, onUpdate }: PresetTableProps) {
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleEditClick = async (preset: Preset) => {
    console.log('Edit button clicked for preset:', preset.id)
    try {
      // Fetch full preset details including items
      const response = await fetch(`/api/presets/${preset.id}`)
      console.log('API response:', response.status)
      if (response.ok) {
        const fullPreset = await response.json()
        console.log('Full preset fetched:', {
          id: fullPreset.id,
          name: fullPreset.name,
          hasItems: !!fullPreset.items,
          itemsCount: fullPreset.items?.length
        })
        setEditingPreset(fullPreset)
        setIsEditModalOpen(true)
        console.log('Modal state set - isOpen:', true, 'preset:', !!fullPreset)
      } else {
        console.error('API error:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Failed to fetch preset details:', error)
    }
  }

  const handleSaveEdit = (updatedPreset: Preset) => {
    onUpdate(updatedPreset)
    setIsEditModalOpen(false)
    setEditingPreset(null)
  }
  return (
    <div className="mb-8">
      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {presets.map((preset) => (
          <div key={preset.id} className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-brand-primary-text mb-1">{preset.name}</h3>
                {preset.description && (
                  <p className="text-xs text-gray-600 dark:text-brand-secondary-text">{preset.description}</p>
                )}
              </div>
              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                preset.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
              }`}>
                {preset.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span className="ml-1 text-brand-primary-text">{preset.category || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Department:</span>
                <span className="ml-1 text-brand-primary-text">{preset.department || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Items:</span>
                <span className="ml-1 font-semibold text-brand-primary-text">{preset._count?.items || 0}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                <span className="ml-1 text-brand-primary-text">{preset.priority}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/presets/${preset.id}`}
                className="flex-1 px-3 py-2 text-center text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors active:scale-95 touch-manipulation"
              >
                View
              </Link>
              <button
                onClick={() => handleEditClick(preset)}
                className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 touch-manipulation"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(preset.id)}
                className="px-3 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors active:scale-95 touch-manipulation"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Preset Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 dark:bg-white/5 divide-y divide-gray-200 dark:divide-gray-700">
              {presets.map((preset) => (
                <tr key={preset.id} className="hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  {/* Preset Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-brand-primary-text">
                      {preset.name}
                    </div>
                    {preset.description && (
                      <div className="text-sm text-gray-600 dark:text-brand-secondary-text truncate max-w-xs">
                        {preset.description}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {preset.category || '-'}
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {preset.department || '-'}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      preset.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
                    }`}>
                      {preset.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-1">
                      <Link
                        href={`/presets/${preset.id}`}
                        className="px-3 py-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEditClick(preset)}
                        className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(preset.id)}
                        className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {presets.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No presets found</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}

      <PresetEditModal
        preset={editingPreset}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPreset(null)
        }}
        onSave={handleSaveEdit}
      />
    </div>
  )
}