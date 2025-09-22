'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import CheckoutDialog from '@/components/assets/checkout-dialog'
import CheckinDialog from '@/components/assets/checkin-dialog'
import MaintenanceRecordForm from '@/components/maintenance/maintenance-record-form'
import MaintenanceTable from '@/components/maintenance/maintenance-table'
import QRGenerator from '@/components/barcode/qr-generator'
import Tabs, { TabContent, TabPanel } from '@/components/ui/tabs'
import { Asset, AssetStatus, AssetCategory, AssetCondition, AssetTransaction, MaintenanceRecord, MaintenanceStatus, User } from '../../../../generated/prisma'

interface AssetWithRelations extends Asset {
  client?: { name: string; code: string; isActive: boolean } | null
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
  category: string
  assetNumber: string
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

interface Category {
  id: string
  name: string
  description?: string
  icon: string
  isCustom: boolean
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
  const [categories, setCategories] = useState<Category[]>([])
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [showCheckinDialog, setShowCheckinDialog] = useState(false)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    category: 'OTHER',
    assetNumber: '',
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchAsset()
    fetchCategories()
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
          assetNumber: assetData.assetNumber || '',
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

  const handleMaintenanceStatusUpdate = async (maintenanceId: string, status: MaintenanceStatus) => {
    try {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // Refresh asset data to get updated maintenance records
        fetchAsset()
      } else {
        console.error('Failed to update maintenance status')
      }
    } catch (error) {
      console.error('Error updating maintenance status:', error)
    }
  }

  const statusColors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    CHECKED_OUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    IN_MAINTENANCE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    RETIRED: 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300',
    MISSING: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    RESERVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }

  const tabs = [
    { 
      id: 'details', 
      label: 'Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'transactions', 
      label: 'Transactions',
      count: asset?.transactions?.length || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    { 
      id: 'maintenance', 
      label: 'Maintenance',
      count: asset?.maintenanceRecords?.length || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'history', 
      label: 'History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-900 dark:to-brand-black">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
      </div>
    )
  }

  if (!session || !asset) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-900 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/assets"
                className="text-gray-700 dark:text-brand-secondary-text hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex-1">
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 text-gray-900 dark:text-brand-primary-text w-full"
                    placeholder="Asset name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-brand-primary-text">{asset.name}</h1>
                )}
                <p className="text-gray-800 dark:text-gray-400">{asset.manufacturer} {asset.model}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 bg-white/80 dark:bg-white/5 transition-colors">
                Print
              </button>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Edit Asset
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setError('')
                      fetchAsset()
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 bg-white/80 dark:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
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

          {/* Main Content - Balanced Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Asset Image & Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                <div className="p-4 space-y-3">
                  {asset.status === 'AVAILABLE' ? (
                    <button 
                      onClick={() => setShowCheckoutDialog(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
                  <button 
                    onClick={() => setShowQRGenerator(true)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 bg-white/80 dark:bg-white/5 px-4 py-2 transition-colors"
                  >
                    Generate QR Code
                  </button>
                </div>
              </div>
            </div>

            {/* Asset Information */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Key Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">Asset Details</h3>
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Category</dt>
                        {editing ? (
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                          >
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text capitalize">
                            {(() => {
                              const category = categories.find(cat => cat.id === asset.category)
                              return category ? `${category.icon} ${category.name}` : asset.category.toLowerCase().replace('_', ' ')
                            })()}
                          </dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Client</dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">
                          {asset.client?.name || (
                            <span className="text-gray-400 dark:text-gray-600">No Client</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Status</dt>
                        {editing ? (
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="CHECKED_OUT">Checked Out</option>
                            <option value="IN_MAINTENANCE">In Maintenance</option>
                            <option value="RETIRED">Retired</option>
                            <option value="MISSING">Missing</option>
                            <option value="RESERVED">Reserved</option>
                          </select>
                        ) : (
                          <dd>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[asset.status as AssetStatus]}`}>
                              {asset.status.replace('_', ' ')}
                            </span>
                          </dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Condition</dt>
                        {editing ? (
                          <select
                            name="condition"
                            value={formData.condition}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                          >
                            <option value="EXCELLENT">Excellent</option>
                            <option value="GOOD">Good</option>
                            <option value="FAIR">Fair</option>
                            <option value="POOR">Poor</option>
                            <option value="NEEDS_REPAIR">Needs Repair</option>
                          </select>
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">{asset.condition}</dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Location</dt>
                        {editing ? (
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                            placeholder="Building, Room, Shelf..."
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">{asset.location || '-'}</dd>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Technical Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">Technical Info</h3>
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Manufacturer</dt>
                        {editing ? (
                          <input
                            type="text"
                            name="manufacturer"
                            value={formData.manufacturer}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">{asset.manufacturer || '-'}</dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Model</dt>
                        {editing ? (
                          <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">{asset.model || '-'}</dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Serial Number</dt>
                        {editing ? (
                          <input
                            type="text"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text font-mono"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text font-mono">{asset.serialNumber || '-'}</dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Barcode</dt>
                        {editing ? (
                          <input
                            type="text"
                            name="barcode"
                            value={formData.barcode}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text font-mono"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text font-mono">{asset.barcode || '-'}</dd>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">Financial</h3>
                    <div className="space-y-3">
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Purchase Date</dt>
                        {editing ? (
                          <input
                            type="date"
                            name="purchaseDate"
                            value={formData.purchaseDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">
                            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                          </dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Purchase Price</dt>
                        {editing ? (
                          <input
                            type="number"
                            name="purchasePrice"
                            value={formData.purchasePrice}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                            placeholder="0.00"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">
                            {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : '-'}
                          </dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Current Value</dt>
                        {editing ? (
                          <input
                            type="number"
                            name="currentValue"
                            value={formData.currentValue}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                            placeholder="0.00"
                          />
                        ) : (
                          <dd className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">
                            {asset.currentValue ? `$${asset.currentValue.toLocaleString()}` : '-'}
                          </dd>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm text-gray-700 dark:text-brand-secondary-text">Asset ID</dt>
                        {editing ? (
                          <input
                            type="text"
                            name="assetNumber"
                            value={formData.assetNumber || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text font-mono text-sm"
                            placeholder="Asset number/ID"
                          />
                        ) : (
                          <dd className="text-sm font-mono text-gray-800 dark:text-gray-400">{asset.assetNumber || asset.id}</dd>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description & Notes */}
                <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-brand-secondary-text mb-2">Description</dt>
                    {editing ? (
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                        placeholder="Asset description..."
                      />
                    ) : (
                      <dd className="text-gray-900 dark:text-brand-primary-text">{asset.description || 'No description provided'}</dd>
                    )}
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-brand-secondary-text mb-2">Notes</dt>
                    {editing ? (
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                        placeholder="Additional notes, maintenance history, special instructions..."
                      />
                    ) : (
                      <dd className="text-gray-900 dark:text-brand-primary-text whitespace-pre-wrap">{asset.notes || 'No notes available'}</dd>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Tabs */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="default"
            size="md"
            className="mb-6"
          />

          {/* Tab Content */}
          <TabContent>
            <TabPanel>
            {activeTab === 'details' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Additional Asset Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-brand-secondary-text">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-brand-primary-text">
                      {new Date(asset.createdAt).toLocaleDateString()} by {asset.createdBy?.name || 'System'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-brand-secondary-text">Last Modified</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-brand-primary-text">
                      {new Date(asset.updatedAt).toLocaleDateString()} by {asset.lastModifiedBy?.name || 'System'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-brand-secondary-text">QR Code</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-brand-primary-text font-mono">
                      {asset.qrCode || 'Not generated'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-brand-secondary-text">Image URL</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-brand-primary-text break-all">
                      {asset.imageUrl ? (
                        <a href={asset.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                          {asset.imageUrl}
                        </a>
                      ) : 'No image'}
                    </dd>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Transaction History</h3>
                {asset.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {asset.transactions.map((transaction) => (
                      <div key={transaction.id} className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-brand-primary-text">
                              {transaction.type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-brand-secondary-text">
                              By {transaction.user.name} on {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                            {transaction.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{transaction.notes}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === 'ACTIVE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                            transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-brand-secondary-text">No transactions recorded</p>
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Maintenance Records</h3>
                  <button
                    onClick={() => setShowMaintenanceForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Schedule Maintenance
                  </button>
                </div>
                <MaintenanceTable
                  maintenanceRecords={asset.maintenanceRecords}
                  onStatusUpdate={handleMaintenanceStatusUpdate}
                  showAssetColumn={false}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Change History</h3>
                <p className="text-gray-700 dark:text-brand-secondary-text">Audit trail will be available soon</p>
              </div>
            )}
            </TabPanel>
          </TabContent>
        </div>
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        asset={asset}
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        onSuccess={() => {
          fetchAsset()
        }}
      />
      
      <CheckinDialog
        asset={asset}
        isOpen={showCheckinDialog}
        onClose={() => setShowCheckinDialog(false)}
        onSuccess={() => {
          fetchAsset()
        }}
      />

      {showMaintenanceForm && (
        <MaintenanceRecordForm
          assetId={asset.id}
          onSuccess={() => {
            setShowMaintenanceForm(false)
            fetchAsset()
          }}
          onCancel={() => setShowMaintenanceForm(false)}
        />
      )}

      <QRGenerator
        data={asset.id}
        assetName={asset.name}
        isOpen={showQRGenerator}
        onClose={() => setShowQRGenerator(false)}
      />
    </div>
  )
}