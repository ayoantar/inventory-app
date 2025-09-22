'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import CheckoutDialog from '@/components/assets/checkout-dialog'
import CheckinDialog from '@/components/assets/checkin-dialog'
import { Asset, AssetStatus, AssetCategory, AssetCondition, AssetTransaction, MaintenanceRecord, User } from '../../../../generated/prisma'

interface AssetWithRelations extends Asset {
  createdBy: { name: string | null; email: string | null }
  lastModifiedBy: { name: string | null; email: string | null }
  transactions: (AssetTransaction & {
    user: { name: string | null; email: string | null }
  })[]
  maintenanceRecords: (MaintenanceRecord & {
    performedBy: { name: string | null; email: string | null } | null
  })[]
}

interface AssetFormData {
  name: string
  description: string
  category: AssetCategory
  serialNumber: string
  barcode: string
  qrCode: string
  status: AssetStatus
  location: string
  purchaseDate: string
  purchasePrice: string
  currentValue: string
  condition: AssetCondition
  manufacturer: string
  model: string
  notes: string
  imageUrl: string
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const resolvedParams = use(params)
  const [asset, setAsset] = useState<AssetWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [showCheckinDialog, setShowCheckinDialog] = useState(false)
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    category: 'OTHER' as AssetCategory,
    serialNumber: '',
    barcode: '',
    qrCode: '',
    status: 'AVAILABLE' as AssetStatus,
    location: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    condition: 'GOOD' as AssetCondition,
    manufacturer: '',
    model: '',
    notes: '',
    imageUrl: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchAsset()
  }, [status, router, resolvedParams.id])

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${resolvedParams.id}`)
      if (response.ok) {
        const assetData = await response.json()
        setAsset(assetData)
        
        // Initialize form data
        setFormData({
          name: assetData.name || '',
          description: assetData.description || '',
          category: assetData.category,
          serialNumber: assetData.serialNumber || '',
          barcode: assetData.barcode || '',
          qrCode: assetData.qrCode || '',
          status: assetData.status,
          location: assetData.location || '',
          purchaseDate: assetData.purchaseDate ? assetData.purchaseDate.split('T')[0] : '',
          purchasePrice: assetData.purchasePrice?.toString() || '',
          currentValue: assetData.currentValue?.toString() || '',
          condition: assetData.condition,
          manufacturer: assetData.manufacturer || '',
          model: assetData.model || '',
          notes: assetData.notes || '',
          imageUrl: assetData.imageUrl || ''
        })
      } else if (response.status === 404) {
        router.push('/assets')
      }
    } catch (error) {
      console.error('Failed to fetch asset:', error)
      setError('Failed to load asset')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/assets/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedAsset = await response.json()
        setAsset(prev => prev ? { ...prev, ...updatedAsset } : null)
        setEditing(false)
        // Refresh the full asset data
        fetchAsset()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update asset')
      }
    } catch (error) {
      setError('An error occurred while updating the asset')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const statusColors = {
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CHECKED_OUT: 'bg-amber-100 text-amber-800 border-amber-300',
    IN_MAINTENANCE: 'bg-red-50 text-red-700 border-red-200',
    RETIRED: 'bg-gray-50 text-gray-700 border-gray-200',
    MISSING: 'bg-red-50 text-red-700 border-red-200',
    RESERVED: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!session || !asset) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/assets"
                className="text-gray-700 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                <p className="text-gray-600">{asset.manufacturer} {asset.model}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${statusColors[asset.status as AssetStatus]}`}>
                {asset.status.replace('_', ' ')}
              </span>
              
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-slate-600 hover:bg-white/10 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Edit Asset
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setError('')
                      fetchAsset() // Reset form data
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-600 hover:bg-white/10 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Asset Information</h2>
                </div>
                <div className="px-6 py-6">
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asset Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="CAMERA">Camera</option>
                          <option value="LENS">Lens</option>
                          <option value="LIGHTING">Lighting</option>
                          <option value="AUDIO">Audio</option>
                          <option value="COMPUTER">Computer</option>
                          <option value="STORAGE">Storage</option>
                          <option value="ACCESSORY">Accessory</option>
                          <option value="FURNITURE">Furniture</option>
                          <option value="SOFTWARE">Software</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="CHECKED_OUT">Checked Out</option>
                          <option value="IN_MAINTENANCE">In Maintenance</option>
                          <option value="RETIRED">Retired</option>
                          <option value="MISSING">Missing</option>
                          <option value="RESERVED">Reserved</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition
                        </label>
                        <select
                          name="condition"
                          value={formData.condition}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                          <option value="NEEDS_REPAIR">Needs Repair</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="text-sm text-gray-900 capitalize">{asset.category.toLowerCase().replace('_', ' ')}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Condition</dt>
                        <dd className="text-sm text-gray-900">{asset.condition}</dd>
                      </div>
                      {asset.description && (
                        <div className="md:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Description</dt>
                          <dd className="text-sm text-gray-900">{asset.description}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Technical Details</h2>
                </div>
                <div className="px-6 py-6">
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          name="manufacturer"
                          value={formData.manufacturer}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          name="model"
                          value={formData.model}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          name="serialNumber"
                          value={formData.serialNumber}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Barcode
                        </label>
                        <input
                          type="text"
                          name="barcode"
                          value={formData.barcode}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {asset.manufacturer && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                          <dd className="text-sm text-gray-900">{asset.manufacturer}</dd>
                        </div>
                      )}
                      {asset.model && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Model</dt>
                          <dd className="text-sm text-gray-900">{asset.model}</dd>
                        </div>
                      )}
                      {asset.serialNumber && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                          <dd className="text-sm text-gray-900 font-mono">{asset.serialNumber}</dd>
                        </div>
                      )}
                      {asset.barcode && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                          <dd className="text-sm text-gray-900 font-mono">{asset.barcode}</dd>
                        </div>
                      )}
                      {asset.location && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Current Location</dt>
                          <dd className="text-sm text-gray-900">{asset.location}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Financial Information</h2>
                </div>
                <div className="px-6 py-6">
                  {editing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          name="purchaseDate"
                          value={formData.purchaseDate}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Purchase Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="purchasePrice"
                          value={formData.purchasePrice}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Value ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="currentValue"
                          value={formData.currentValue}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                      {asset.purchaseDate && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                          <dd className="text-sm text-gray-900">
                            {new Date(asset.purchaseDate).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                      {asset.purchasePrice && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                          <dd className="text-sm text-gray-900">${asset.purchasePrice.toLocaleString()}</dd>
                        </div>
                      )}
                      {asset.currentValue && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Current Value</dt>
                          <dd className="text-sm text-gray-900">${asset.currentValue.toLocaleString()}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
              </div>

              {/* Notes */}
              {(editing || asset.notes) && (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Notes</h2>
                  </div>
                  <div className="px-6 py-6">
                    {editing ? (
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional notes or comments about this asset..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{asset.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                </div>
                <div className="px-6 py-6 space-y-3">
                  {asset.status === 'AVAILABLE' ? (
                    <button 
                      onClick={() => setShowCheckoutDialog(true)}
                      className="w-full bg-slate-600 hover:bg-white/10 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Check Out Asset
                    </button>
                  ) : asset.status === 'CHECKED_OUT' ? (
                    <button 
                      onClick={() => setShowCheckinDialog(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Check In Asset
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
                    >
                      Asset Not Available
                    </button>
                  )}
                  <button className="w-full bg-gray-600 hover:bg-white/10 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Schedule Maintenance
                  </button>
                  <button className="w-full border border-gray-300 hover:bg-white/10 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Generate QR Code
                  </button>
                </div>
              </div>

              {/* Asset Image */}
              <div className="bg-white/80 dark:bg-white/5 shadow-sm rounded-lg border border-gray-300 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">Asset Image</h2>
                </div>
                <div className="px-6 py-4">
                  {asset.imageUrl ? (
                    <div className="space-y-2">
                      <img
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="w-24 h-24 mx-auto object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      {editing && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Image URL
                          </label>
                          <input
                            type="url"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  ) : editing ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-700 dark:text-brand-secondary-text mt-1">
                        Enter a URL to an image of this asset
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-700 dark:text-brand-secondary-text mt-1">No image available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
                </div>
                <div className="px-6 py-6">
                  {asset.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {asset.transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.user.name} • {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            transaction.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800' :
                            transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent transactions</p>
                  )}
                </div>
              </div>

              {/* Asset Metadata */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Asset Details</h2>
                </div>
                <div className="px-6 py-6">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(asset.createdAt).toLocaleDateString()} by {asset.createdBy.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(asset.updatedAt).toLocaleDateString()} by {asset.lastModifiedBy.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Asset ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{asset.id}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        asset={asset}
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        onSuccess={() => {
          fetchAsset() // Refresh asset data
        }}
      />
      
      <CheckinDialog
        asset={asset}
        isOpen={showCheckinDialog}
        onClose={() => setShowCheckinDialog(false)}
        onSuccess={() => {
          fetchAsset() // Refresh asset data
        }}
      />
    </div>
  )
}