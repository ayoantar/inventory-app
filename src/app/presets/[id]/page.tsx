'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import PresetEditModal from '@/components/presets/preset-edit-modal'

interface PresetItem {
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
}

interface PresetCheckout {
  id: string
  status: string
  checkoutDate: string
  expectedReturnDate?: string
  actualReturnDate?: string
  completionPercent: number
  user: {
    name?: string
    email?: string
  }
}

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
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name?: string
    email?: string
  }
  items: PresetItem[]
  checkouts: PresetCheckout[]
  _count: {
    items: number
    checkouts: number
    substitutions: number
  }
}

export default function PresetDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [preset, setPreset] = useState<Preset | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const presetId = params.id as string

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (presetId) {
      fetchPreset()
    }
  }, [status, router, presetId])

  const fetchPreset = async () => {
    try {
      const response = await fetch(`/api/presets/${presetId}`)
      if (response.ok) {
        const data = await response.json()
        setPreset(data)
      } else if (response.status === 404) {
        router.push('/presets')
      }
    } catch (error) {
      console.error('Failed to fetch preset:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!preset) return

    const confirmMessage = `Delete preset "${preset.name}"?\n\nThis will permanently delete the preset and all its items. This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('Preset deleted successfully')
        router.push('/presets')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to delete preset:', error)
      alert('Failed to delete preset. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const canEdit = () => {
    if (!session?.user || !preset) return false
    const userRole = (session.user as any).role
    const isOwner = preset.createdBy.id === (session.user as any).id
    return isOwner || userRole === 'ADMIN' || userRole === 'MANAGER'
  }

  const canDelete = () => {
    if (!session?.user || !preset) return false
    const userRole = (session.user as any).role
    const isOwner = preset.createdBy.id === (session.user as any).id
    return isOwner || userRole === 'ADMIN'
  }

  const handleSaveEdit = (updatedPreset: Preset) => {
    setPreset(updatedPreset)
    setIsEditModalOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
    }
  }

  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-green-600'
      case 'CHECKED_OUT':
        return 'text-yellow-600'
      case 'IN_MAINTENANCE':
        return 'text-red-600'
      case 'RETIRED':
        return 'text-brand-primary-text'
      default:
        return 'text-brand-primary-text'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (!session || !preset) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Link
                  href="/presets"
                  className="text-white/60 dark:text-white/60 hover:text-slate-500 dark:hover:text-slate-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-brand-secondary-text bg-clip-text text-transparent">
                  {preset.name}
                </h1>
                {preset.isTemplate && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Template
                  </span>
                )}
                {!preset.isActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
              {preset.description && (
                <p className="text-brand-primary-text ml-11 max-w-2xl">
                  {preset.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {canEdit() && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              {canDelete() && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2.5 bg-red-600 hover disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:transform-none"
                >
                  {deleting ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Preset Information Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Category</p>
                  <p className="text-sm font-medium text-brand-primary-text">{preset.category || 'None'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5v5M3 21h6m0 0v-5" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Department</p>
                  <p className="text-sm font-medium text-brand-primary-text">{preset.department || 'None'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Duration</p>
                  <p className="text-sm font-medium text-brand-primary-text">
                    {preset.estimatedDuration ? `${preset.estimatedDuration}h` : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Total Checkouts</p>
                  <p className="text-sm font-medium text-brand-primary-text">{preset._count.checkouts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Items Table */}
          <div className="bg-gray-900/5 rounded-lg border border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700">
              <h2 className="text-base font-semibold text-brand-primary-text flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Preset Items ({preset._count.items})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-900/5">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/5 divide-y divide-gray-300">
                  {preset.items.map((item) => (
                    <tr key={item.id} className="hover transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-brand-primary-text">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                              {item.category && `Category: ${item.category}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-brand-primary-text">
                            {item.quantity}
                          </span>
                          {item.isRequired && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.asset ? (
                          <div className="text-sm">
                            <div className="text-brand-primary-text font-medium">
                              {item.asset.assetNumber || item.asset.name}
                            </div>
                            {item.asset.manufacturer && item.asset.model && (
                              <div className="text-gray-600 dark:text-brand-secondary-text">
                                {item.asset.manufacturer} {item.asset.model}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-white/50 hover:text-white/80 transition-colors">No specific asset</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.asset ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                            item.asset.status === 'CHECKED_OUT' ? 'bg-yellow-100 text-yellow-800' :
                            item.asset.status === 'IN_MAINTENANCE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                          }`}>
                            {item.asset.status}
                          </span>
                        ) : (
                          <span className="text-sm text-white/50 hover:text-white/80 transition-colors">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-primary-text">
                        {item.priority}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 dark:text-brand-secondary-text max-w-xs truncate">
                          {item.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {preset.items.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No items in this preset</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                  Add items to this preset to get started.
                </p>
              </div>
            )}
          </div>

          {/* Recent Checkouts Table */}
          {preset.checkouts.length > 0 && (
            <div className="bg-gray-900/5 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <h2 className="text-base font-semibold text-brand-primary-text flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Recent Checkouts
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-900/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                        Checkout Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                        Return Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/5 divide-y divide-gray-300">
                    {preset.checkouts.map((checkout) => (
                      <tr key={checkout.id} className="hover transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {(checkout.user.name || checkout.user.email)?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-brand-primary-text">
                                {checkout.user.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                                {checkout.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-primary-text">
                          {new Date(checkout.checkoutDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(checkout.status)}`}>
                            {checkout.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-16">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    checkout.completionPercent === 100 ? 'bg-green-500' :
                                    checkout.completionPercent >= 75 ? 'bg-blue-500' :
                                    checkout.completionPercent >= 50 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${checkout.completionPercent}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="ml-2 text-sm text-brand-primary-text">
                              {checkout.completionPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-primary-text">
                          {checkout.actualReturnDate ? 
                            new Date(checkout.actualReturnDate).toLocaleDateString() :
                            checkout.expectedReturnDate ?
                            `Expected: ${new Date(checkout.expectedReturnDate).toLocaleDateString()}` :
                            '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-medium text-gray-600 dark:text-brand-secondary-text mb-2">Created By</h3>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {(preset.createdBy.name || preset.createdBy.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-brand-primary-text">
                      {preset.createdBy.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-brand-secondary-text">
                      {preset.createdBy.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-gray-600 dark:text-brand-secondary-text mb-2">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-brand-secondary-text">Created:</span>
                    <span className="text-brand-primary-text">{new Date(preset.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-brand-secondary-text">Last Updated:</span>
                    <span className="text-brand-primary-text">{new Date(preset.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {preset.notes && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-xs font-medium text-gray-600 dark:text-brand-secondary-text mb-2">Notes</h3>
                <p className="text-brand-primary-text whitespace-pre-wrap">
                  {preset.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <PresetEditModal
        preset={preset}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  )
}