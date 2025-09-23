'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import AssetGroupFormDialog from '@/components/asset-groups/asset-group-form-dialog'

interface AssetGroup {
  id: string
  name: string
  description: string | null
  category: string | null
  location: string | null  
  notes: string | null
  isActive: boolean
  createdAt: string
  createdBy: {
    name: string | null
    email: string | null
  }
  members: Array<{
    id: string
    quantity: number
    asset: {
      id: string
      name: string
      description: string | null
      category: string
      status: string
      condition: string
      imageUrl: string | null
      manufacturer: string | null
      model: string | null
      serialNumber: string | null
      location: string | null
      purchasePrice: number | null
      currentValue: number | null
    }
  }>
  _count: {
    members: number
  }
}

export default function AssetGroupDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [group, setGroup] = useState<AssetGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (params.id) {
      fetchGroup()
    }
  }, [status, router, params.id])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/asset-groups/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data)
      } else if (response.status === 404) {
        setError('Asset group not found')
      } else {
        setError('Failed to load asset group')
      }
    } catch (error) {
      console.error('Failed to fetch asset group:', error)
      setError('Failed to load asset group')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!group) return
    
    if (!confirm('Are you sure you want to delete this asset group? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/asset-groups/${group.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/asset-groups')
      } else {
        alert('Failed to delete asset group')
      }
    } catch (error) {
      console.error('Failed to delete asset group:', error)
      alert('An error occurred while deleting the asset group')
    }
  }

  const handleEditSuccess = () => {
    fetchGroup()
    setShowEditDialog(false)
  }

  const calculateTotalValue = () => {
    if (!group) return 0
    return group.members.reduce((total, member) => {
      return total + (member.asset.currentValue || member.asset.purchasePrice || 0)
    }, 0)
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-brand-primary-text">{error}</h3>
              <div className="mt-6">
                <Link
                  href="/asset-groups"
                  className="bg-blue-600 hover text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors"
                >
                  ← Back to Asset Groups
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Link
                    href="/asset-groups"
                    className="text-white/60 dark:text-white/60 hover:text-slate-500 dark:hover:text-slate-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Link>
                  <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-brand-secondary-text bg-clip-text text-transparent">
                    {group.name}
                  </h1>
                </div>
                {group.description && (
                  <p className="text-brand-primary-text ml-11 max-w-2xl mb-4">{group.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-brand-secondary-text ml-11">
                  <span>{group._count.members} assets</span>
                  {group.category && <span>• {group.category}</span>}
                  {group.location && <span>• {group.location}</span>}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                  }`}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditDialog(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Group
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transform hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Group
                </button>
              </div>
            </div>
          </div>

          {/* Group Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              {/* Assets List */}
              <div className="bg-gray-900/5/80 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-xl shadow-gray-200/20">
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-brand-primary-text">
                    Assets ({group.members.length})
                  </h2>
                </div>
                {group.members.length > 0 ? (
                  <div className="divide-y divide-gray-300">
                    {group.members.map((member) => (
                      <div key={member.id} className="p-3 hover transition-colors">
                        <div className="flex items-center">
                          <div className="w-10 h-10 mr-3 flex-shrink-0">
                            {member.asset.imageUrl ? (
                              <img
                                src={member.asset.imageUrl}
                                alt={member.asset.description || member.asset.name}
                                className="w-10 h-10 object-cover rounded-lg border border-gray-600"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <span className="text-sm">📦</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/assets/${member.asset.id}`}
                              className="text-base font-medium text-brand-primary-text hover transition-colors block"
                            >
                              {member.asset.description || member.asset.name || `Asset ${member.asset.id.slice(-4)}`}
                            </Link>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600 dark:text-brand-secondary-text">
                              {member.asset.name && member.asset.name !== member.asset.description && (
                                <span>ID: {member.asset.name}</span>
                              )}
                              <span>{member.asset.category.replace('_', ' ')}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                member.asset.status === 'AVAILABLE'
                                  ? 'bg-green-100 text-green-800'
                                  : member.asset.status === 'CHECKED_OUT'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                              }`}>
                                {member.asset.status.replace('_', ' ')}
                              </span>
                              {member.asset.location && <span>• {member.asset.location}</span>}
                              {(member.asset.manufacturer || member.asset.model) && (
                                <span>• {`${member.asset.manufacturer || ''} ${member.asset.model || ''}`.trim()}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            {(member.asset.currentValue || member.asset.purchasePrice) && (
                              <div className="text-sm font-medium text-brand-primary-text">
                                ${(member.asset.currentValue || member.asset.purchasePrice)?.toLocaleString()}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 dark:text-brand-secondary-text">
                              Qty: {member.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-gray-600 dark:text-brand-secondary-text">
                      No assets in this group
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-900/5/80 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-xl shadow-gray-200/20 p-6">
                <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-brand-primary-text">Total Assets:</span>
                    <span className="font-medium text-brand-primary-text">{group.members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-primary-text">Total Value:</span>
                    <span className="font-medium text-brand-primary-text">
                      ${calculateTotalValue().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-primary-text">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      group.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-gray-900/5/80 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-xl shadow-gray-200/20 p-6">
                <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  {group.category && (
                    <div>
                      <span className="text-brand-primary-text">Category:</span>
                      <div className="font-medium text-brand-primary-text">{group.category}</div>
                    </div>
                  )}
                  {group.location && (
                    <div>
                      <span className="text-brand-primary-text">Location:</span>
                      <div className="font-medium text-brand-primary-text">{group.location}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-brand-primary-text">Created:</span>
                    <div className="font-medium text-brand-primary-text">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-brand-primary-text">Created By:</span>
                    <div className="font-medium text-brand-primary-text">
                      {group.createdBy?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {group.notes && (
                <div className="bg-gray-900/5/80 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-xl shadow-gray-200/20 p-6">
                  <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Notes</h3>
                  <div className="text-sm text-brand-primary-text whitespace-pre-wrap">
                    {group.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <AssetGroupFormDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditSuccess}
        group={group}
      />
    </div>
  )
}