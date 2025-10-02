'use client'

import { useState, useEffect } from 'react'

interface PresetItem {
  id?: string
  assetId?: string
  category?: string
  name: string
  quantity: number
  isRequired: boolean
  priority: number
  notes?: string
}

interface PresetFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}


interface Asset {
  id: string
  name: string
  category: string
  status: string
  description?: string
  manufacturer?: string
  imageUrl?: string | null
  assetNumber?: string
  serialNumber?: string
  barcode?: string
  qrCode?: string
}

export default function PresetFormModal({ isOpen, onClose, onSuccess }: PresetFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])
  const [assetSearch, setAssetSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isTemplate: false,
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchAssets()
      fetchCategories()
    }
  }, [isOpen])

  const fetchAssets = async () => {
    setAssetsLoading(true)
    try {
      const response = await fetch('/api/assets?limit=500')
      if (response.ok) {
        const data = await response.json()

        // Remove duplicates by ID
        const uniqueAssets = data.assets?.filter((asset, index, self) =>
          index === self.findIndex(a => a.id === asset.id)
        ) || []

        setAvailableAssets(uniqueAssets)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setAssetsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/preset-categories?active=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      isTemplate: false,
      notes: ''
    })
    setSelectedAssets([])
    setAssetSearch('')
    setStatusFilter('')
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleAssetToggle = (asset: Asset) => {
    const isSelected = selectedAssets.some(a => a.id === asset.id)
    
    if (isSelected) {
      setSelectedAssets(prev => prev.filter(a => a.id !== asset.id))
    } else {
      setSelectedAssets(prev => [...prev, asset])
    }
  }

  const filteredAssets = availableAssets
    .filter(asset => {
      const searchTerm = assetSearch.toLowerCase()
      const assetName = (asset.name || '').toLowerCase()
      const assetCategory = (asset.category || '').toLowerCase()
      const assetManufacturer = (asset.manufacturer || '').toLowerCase()
      const assetId = asset.id.toString()
      const assetNumber = (asset.assetNumber || '').toLowerCase()
      const serialNumber = (asset.serialNumber || '').toLowerCase()
      const barcode = (asset.barcode || '').toLowerCase()
      const qrCode = (asset.qrCode || '').toLowerCase()

      const matchesSearch = assetName.includes(searchTerm) ||
                           assetCategory.includes(searchTerm) ||
                           assetManufacturer.includes(searchTerm) ||
                           assetId.includes(searchTerm) ||
                           assetNumber.includes(searchTerm) ||
                           serialNumber.includes(searchTerm) ||
                           barcode.includes(searchTerm) ||
                           qrCode.includes(searchTerm)

      const matchesStatus = !statusFilter || asset.status === statusFilter

      return matchesSearch && matchesStatus
    })
    // Additional deduplication to prevent React key conflicts
    .filter((asset, index, self) =>
      index === self.findIndex(a => a.id === asset.id)
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (!formData.name.trim()) {
        setError('Please enter a preset name')
        return
      }

      if (selectedAssets.length === 0) {
        setError('Please select at least one asset for the preset')
        return
      }

      // Convert selected assets to preset items format
      const items = selectedAssets.map((asset, index) => ({
        assetId: asset.id,
        name: asset.name,
        category: asset.category,
        quantity: 1,
        isRequired: true,
        priority: index,
        notes: ''
      }))

      const submitData = {
        ...formData,
        items
      }
      
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        handleClose()
      } else {
        setError(data.error || 'Failed to create preset')
      }
    } catch (error) {
      setError('An error occurred while creating the preset')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-brand-primary-text">
              Create New Preset
            </h2>
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
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preset Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-brand-primary-text">Preset Details</h3>
                
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
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="e.g., Camera Shoot Basic Kit"
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
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
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
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="Describe what this preset is used for..."
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isTemplate"
                      checked={formData.isTemplate}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-800/50 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-300">Use as template</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    placeholder="Additional notes or instructions for this preset..."
                  />
                </div>
              </div>

              {/* Asset Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-brand-primary-text">Select Assets</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Search Assets
                    </label>
                    <input
                      type="text"
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                      placeholder="Search by name, category, manufacturer, or ID..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    >
                      <option value="">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="CHECKED_OUT">Checked Out</option>
                      <option value="IN_MAINTENANCE">In Maintenance</option>
                      <option value="RETIRED">Retired</option>
                      <option value="MISSING">Missing</option>
                      <option value="RESERVED">Reserved</option>
                    </select>
                  </div>
                </div>

                {/* Selected Assets */}
                {selectedAssets.length > 0 && (
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg">
                    <div className="p-4 pb-2">
                      <h4 className="text-sm font-medium text-blue-300">
                        Selected Assets ({selectedAssets.length})
                      </h4>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {selectedAssets.map((asset) => (
                          <div key={asset.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-blue-800/20 transition-colors">
                            <div className="flex-1 mr-4">
                            <span className="text-blue-200 font-medium">
                              {asset.name || `Asset ${asset.id.slice(-4)}`}
                            </span>
                            {asset.description && (
                              <div className="text-blue-400 text-xs mt-1">
                                {asset.description.split('\n').slice(0, 2).map((line, lineIndex) => (
                                  <div key={`${asset.id}-selected-desc-${lineIndex}`}>{line}</div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssetToggle(asset)}
                            className="text-blue-400 hover:text-blue-300 ml-2 flex-shrink-0 transition-colors"
                          >
                            Remove
                          </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Assets */}
                <div className="border border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                  {assetsLoading ? (
                    <div className="p-4 text-center text-gray-600 dark:text-brand-secondary-text">
                      Loading assets...
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="p-4 text-center text-gray-600 dark:text-brand-secondary-text">
                      No available assets found
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredAssets.map((asset, index) => {
                        const isSelected = selectedAssets.some(a => a.id === asset.id)
                        return (
                          <div
                            key={asset.id}
                            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-500/20 border border-blue-500/30'
                                : 'hover:bg-gray-700/30 border border-transparent'
                            }`}
                            onClick={() => handleAssetToggle(asset)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleAssetToggle(asset)}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-brand-primary-text">
                                {asset.name || `Asset ${asset.id.slice(-4)}`}
                              </div>
                              {asset.description && (
                                <div className="text-xs text-white/50 hover:text-white/80 transition-colors mt-1">
                                  {asset.description.split('\n').slice(0, 2).map((line, lineIndex) => (
                                    <div key={`${asset.id}-desc-${lineIndex}`}>{line}</div>
                                  ))}
                                </div>
                              )}
                              <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                                {asset.category?.replace('_', ' ') || 'No Category'} • 
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  asset.status === 'AVAILABLE'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : asset.status === 'CHECKED_OUT'
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                    : asset.status === 'IN_MAINTENANCE'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                }`}>
                                  {asset.status?.replace('_', ' ') || 'Unknown'}
                                </span>
                              </div>
                            </div>
                            {asset.imageUrl && (
                              <img
                                src={asset.imageUrl}
                                alt={asset.name}
                                className="w-10 h-10 object-cover rounded ml-2"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-500/30 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Preset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}