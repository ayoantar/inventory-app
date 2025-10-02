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
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div
          className="relative bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-primary-text">Edit Preset</h3>
            <button
              onClick={handleClose}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brand-primary-text">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter preset name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Describe what this preset is used for..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-800 bg-gray-900 border-2 border-gray-400 rounded focus:ring-2 focus:ring-blue-600 focus:border-blue-600 checked checked:border-blue-800:border-blue-700"
                />
                <span className="ml-2 text-sm font-medium text-gray-300">Active Status</span>
              </div>
            </div>

            {/* Right Column - Preset Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-brand-primary-text">Preset Items</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-2 py-1 bg-blue-600 hover text-white rounded text-xs font-medium transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item.tempId} className="flex items-center space-x-2 p-2 bg-gray-800/50 rounded">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      required
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-12 px-1 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={item.isRequired}
                        onChange={(e) => handleItemChange(index, 'isRequired', e.target.checked)}
                        className="w-3 h-3 text-blue-600 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-1 text-gray-300">Req</span>
                    </label>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover p-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional notes or instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 hover rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}