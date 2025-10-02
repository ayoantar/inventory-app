'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface PresetItem {
  id?: string
  tempId: string
  assetId?: string
  category?: string
  name: string
  quantity: number
  isRequired: boolean
  priority: number
  notes?: string
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
}

interface Preset {
  id: string
  name: string
  description?: string
  category?: string
  isActive: boolean
  isTemplate: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    id: string
    name?: string
    email?: string
  }
  items: Array<{
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

interface PresetEditModalProps {
  preset: Preset | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPreset: Preset) => void
}

const categories = [
  'Camera Kit',
  'Audio Setup',
  'Lighting Kit',
  'Conference Setup',
  'Video Production',
  'Photography',
  'Live Streaming',
  'Event Setup'
]


const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function PresetEditModal({ preset, isOpen, onClose, onSave }: PresetEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true,
    notes: ''
  })
  const [items, setItems] = useState<PresetItem[]>([])

  useEffect(() => {
    if (preset && isOpen) {
      setFormData({
        name: preset.name,
        description: preset.description || '',
        category: preset.category || '',
        isActive: preset.isActive,
        notes: preset.notes || ''
      })

      if (preset.items && Array.isArray(preset.items)) {
        setItems(preset.items.map(item => ({
          id: item.id,
          tempId: generateUniqueId(),
          assetId: item.assetId,
          category: item.category,
          name: item.name,
          quantity: item.quantity,
          isRequired: item.isRequired,
          priority: item.priority,
          notes: item.notes,
          asset: item.asset
        })))
      } else {
        setItems([])
      }
      setError('')
    }
  }, [preset, isOpen])

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleItemChange = (index: number, field: keyof PresetItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }
    setItems(updatedItems)
  }

  const addItem = () => {
    setItems([...items, {
      tempId: generateUniqueId(),
      name: '',
      quantity: 1,
      isRequired: true,
      priority: items.length,
      notes: ''
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index)
      setItems(updatedItems)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!preset) return

    setError('')

    if (!formData.name.trim()) {
      setError('Please enter a preset name')
      return
    }

    const validItems = items.filter(item => item.name.trim())
    if (validItems.length === 0) {
      setError('Please add at least one item to the preset')
      return
    }

    const itemsForAPI = validItems.map(({ tempId, ...item }) => item)

    setSaving(true)
    try {
      const response = await fetch(`/api/presets/${preset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          items: itemsForAPI
        })
      })

      if (response.ok) {
        const updatedPreset = await response.json()
        onSave(updatedPreset)
        handleClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update preset')
      }
    } catch (error) {
      console.error('Failed to update preset:', error)
      setError('Failed to update preset. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/50 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Preset</h2>
                <p className="text-xs text-gray-400">Modify configuration and items</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-300">Error</h3>
                    <p className="text-sm text-red-200/80 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-700/50">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white">Basic Information</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Preset Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                      placeholder="e.g., Professional Camera Kit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all backdrop-blur-sm"
                      placeholder="Describe the purpose and typical use cases..."
                    />
                  </div>

                  <div className="flex items-center p-2.5 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500/50"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-300">
                      Active preset (available for checkout)
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Preset Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Items ({items.length})</h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600/90 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-all shadow-lg shadow-green-500/20"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-800/20 rounded-xl border-2 border-dashed border-gray-700/50">
                      <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm text-gray-500 font-medium">No items added yet</p>
                      <p className="text-xs text-gray-600 mt-1">Click "Add Item" to get started</p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div key={item.tempId} className="group flex items-center gap-3 p-2.5 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                            placeholder="Item name"
                          />
                        </div>

                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-16 px-2 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                        />

                        <label className="flex items-center space-x-1.5 px-2.5 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg cursor-pointer hover:bg-gray-900/70 transition-all">
                          <input
                            type="checkbox"
                            checked={item.isRequired}
                            onChange={(e) => handleItemChange(index, 'isRequired', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-1 focus:ring-blue-500/50"
                          />
                          <span className="text-xs font-medium text-gray-300">Req</span>
                        </label>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all backdrop-blur-sm"
                placeholder="Additional notes or requirements..."
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between backdrop-blur-sm">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
