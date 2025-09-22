'use client'

import { useState, useEffect } from 'react'
import { Asset } from '../../../generated/prisma'

interface AssetGroupFormData {
  name: string
  description: string
  category: string
  location: string
  notes: string
  assetIds: string[]
}

interface AssetGroup {
  id: string
  name: string
  description: string | null
  category: string | null
  location: string | null
  notes: string | null
  isActive: boolean
  members: Array<{
    asset: {
      id: string
      name: string
      category: string
      status: string
      imageUrl: string | null
    }
  }>
}

interface AssetGroupFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  group?: AssetGroup | null
}

export default function AssetGroupFormDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  group 
}: AssetGroupFormDialogProps) {
  const [formData, setFormData] = useState<AssetGroupFormData>({
    name: '',
    description: '',
    category: '',
    location: '',
    notes: '',
    assetIds: []
  })
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [assetSearch, setAssetSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (group) {
        // Edit mode - populate form with existing data
        setFormData({
          name: group.name,
          description: group.description || '',
          category: group.category || '',
          location: group.location || '',
          notes: group.notes || '',
          assetIds: group.members.map(m => m.asset.id)
        })
        setSelectedAssets(group.members.map(m => ({
          ...m.asset,
          serialNumber: null,
          barcode: null,
          qrCode: null,
          status: m.asset.status as any,
          condition: 'GOOD',
          purchaseDate: null,
          purchasePrice: null,
          currentValue: null,
          manufacturer: null,
          model: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: '',
          lastModifiedById: ''
        } as Asset)))
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          location: '',
          notes: '',
          assetIds: []
        })
        setSelectedAssets([])
      }
      fetchAvailableAssets()
    }
  }, [isOpen, group])

  const fetchAvailableAssets = async () => {
    setLoadingAssets(true)
    try {
      const response = await fetch('/api/assets?limit=500')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched assets sample:', data.assets?.slice(0, 5)) // Debug log
        console.log('Asset names check:', data.assets?.slice(0, 5).map(a => ({ id: a.id, name: a.name, hasName: !!a.name })))
        
        // Remove duplicates by ID
        const uniqueAssets = data.assets?.filter((asset, index, self) => 
          index === self.findIndex(a => a.id === asset.id)
        ) || []
        
        console.log('Original count:', data.assets?.length, 'Unique count:', uniqueAssets.length)
        setAvailableAssets(uniqueAssets)
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoadingAssets(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAssetToggle = (asset: Asset) => {
    const isSelected = selectedAssets.some(a => a.id === asset.id)
    
    if (isSelected) {
      setSelectedAssets(prev => prev.filter(a => a.id !== asset.id))
      setFormData(prev => ({ 
        ...prev, 
        assetIds: prev.assetIds.filter(id => id !== asset.id) 
      }))
    } else {
      setSelectedAssets(prev => [...prev, asset])
      setFormData(prev => ({ 
        ...prev, 
        assetIds: [...prev.assetIds, asset.id] 
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = group ? `/api/asset-groups/${group.id}` : '/api/asset-groups'
      const method = group ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        handleClose()
      } else {
        setError(data.error || `Failed to ${group ? 'update' : 'create'} asset group`)
      }
    } catch (error) {
      setError(`An error occurred while ${group ? 'updating' : 'creating'} the asset group`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      location: '',
      notes: '',
      assetIds: []
    })
    setSelectedAssets([])
    setAssetSearch('')
    setStatusFilter('')
    setError('')
    onClose()
  }

  const filteredAssets = availableAssets
    .filter(asset => {
      const searchTerm = assetSearch.toLowerCase()
      const assetName = (asset.name || '').toLowerCase()
      const assetCategory = (asset.category || '').toLowerCase()
      const assetManufacturer = (asset.manufacturer || '').toLowerCase()
      const assetId = asset.id.toString()
      
      const matchesSearch = assetName.includes(searchTerm) ||
                           assetCategory.includes(searchTerm) ||
                           assetManufacturer.includes(searchTerm) ||
                           assetId.includes(searchTerm)
      
      const matchesStatus = !statusFilter || asset.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    // Additional deduplication to prevent React key conflicts
    .filter((asset, index, self) => 
      index === self.findIndex(a => a.id === asset.id)
    )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-50 dark:bg-white/5 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-brand-primary-text">
              {group ? 'Edit Asset Group' : 'Create Asset Group'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Group Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">Group Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                    placeholder="e.g., Film Production Kit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                  >
                    <option value="">Select Category</option>
                    <option value="Production">Production</option>
                    <option value="Studio Setup">Studio Setup</option>
                    <option value="Post Production">Post Production</option>
                    <option value="Audio Equipment">Audio Equipment</option>
                    <option value="Camera Equipment">Camera Equipment</option>
                    <option value="Lighting Equipment">Lighting Equipment</option>
                    <option value="Storage & Media">Storage & Media</option>
                    <option value="Computer Equipment">Computer Equipment</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                  >
                    <option value="">Select Location</option>
                    <option value="Studio A">Studio A</option>
                    <option value="Studio B">Studio B</option>
                    <option value="Studio C">Studio C</option>
                    <option value="Control Room">Control Room</option>
                    <option value="Edit Suite 1">Edit Suite 1</option>
                    <option value="Edit Suite 2">Edit Suite 2</option>
                    <option value="Edit Suite 3">Edit Suite 3</option>
                    <option value="Color Suite">Color Suite</option>
                    <option value="Audio Room">Audio Room</option>
                    <option value="Equipment Room">Equipment Room</option>
                    <option value="Storage Room">Storage Room</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Location Shoot">Location Shoot</option>
                    <option value="Client Area">Client Area</option>
                    <option value="Reception">Reception</option>
                    <option value="Office">Office</option>
                    <option value="Mobile Unit">Mobile Unit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                    placeholder="Brief description of this asset group..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                    placeholder="Additional notes, usage instructions, etc..."
                  />
                </div>
              </div>

              {/* Asset Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">Select Assets</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Search Assets
                    </label>
                    <input
                      type="text"
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text placeholder-gray-600 dark:placeholder-gray-400"
                      placeholder="Search by name, category, manufacturer, or ID..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
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
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Selected Assets ({selectedAssets.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {selectedAssets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1">
                            <span className="text-blue-800 dark:text-blue-200 font-medium">
                              {asset.name || `Asset ${asset.id.slice(-4)}`}
                            </span>
                            {asset.description && (
                              <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                {asset.description.split('\n').slice(0, 2).map((line, lineIndex) => (
                                  <div key={`${asset.id}-selected-desc-${lineIndex}`}>{line}</div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssetToggle(asset)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Assets */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                  {loadingAssets ? (
                    <div className="p-4 text-center text-gray-700 dark:text-brand-secondary-text">
                      Loading assets...
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="p-4 text-center text-gray-700 dark:text-brand-secondary-text">
                      No available assets found
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredAssets.map((asset, index) => {
                        const isSelected = selectedAssets.some(a => a.id === asset.id)
                        return (
                          <div
                            key={asset.id}
                            className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'hover:bg-white/10 dark:hover:bg-white/10'
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
                              <div className="font-medium text-gray-900 dark:text-brand-primary-text">
                                {asset.name || `Asset ${asset.id.slice(-4)}`}
                              </div>
                              {asset.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {asset.description.split('\n').slice(0, 2).map((line, lineIndex) => (
                                    <div key={`${asset.id}-desc-${lineIndex}`}>{line}</div>
                                  ))}
                                </div>
                              )}
                              <div className="text-sm text-gray-700 dark:text-brand-secondary-text">
                                {asset.category?.replace('_', ' ') || 'No Category'} • 
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  asset.status === 'AVAILABLE' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : asset.status === 'CHECKED_OUT'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : asset.status === 'IN_MAINTENANCE'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
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
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-300 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (group ? 'Updating...' : 'Creating...') : (group ? 'Update Group' : 'Create Group')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}