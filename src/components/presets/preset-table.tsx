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
  'Camera Kit': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Audio Setup': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Lighting Kit': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Conference Setup': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Video Production': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const getCategoryColor = (category?: string) => {
  if (!category) return 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
  return categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
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
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/20 dark:shadow-gray-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-300/50 dark:divide-gray-700/50">
            <thead className="bg-white/80 dark:bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                  Preset Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/80 dark:bg-white/5 divide-y divide-gray-300/30 dark:divide-gray-700/30">
              {presets.map((preset) => (
                <tr key={preset.id} className="hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-200">
                {/* Preset Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                    {preset.name}
                  </div>
                </td>
                
                {/* Category */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                    {preset.category || '-'}
                  </div>
                </td>
                
                {/* Department */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                    {preset.department || '-'}
                  </div>
                </td>
                
                {/* Status */}
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    preset.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
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
                      className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleEditClick(preset)}
                      className="px-3 py-1.5 text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 rounded-md transition-colors"
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
      
      {presets.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-brand-primary-text">No presets found</h3>
          <p className="mt-1 text-sm text-gray-700 dark:text-brand-secondary-text">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}
      </div>
      
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