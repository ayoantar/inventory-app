'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import LocationDialog from '@/components/locations/location-dialog'

interface Asset {
  id: string
  name: string
  category: string
  status: string
  imageUrl?: string
}

interface AssetGroup {
  id: string
  name: string
  description?: string
  _count: {
    members: number
  }
}

interface Location {
  id: string
  name: string
  building: string | null
  floor: string | null
  room: string | null
  description: string | null
  capacity: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  assets: Asset[]
  assetGroups: AssetGroup[]
  _count: {
    assets: number
    assetGroups: number
    assetTransactions: number
  }
}

export default function LocationDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (params?.id) {
      fetchLocation()
    }
  }, [status, router, params?.id])

  const fetchLocation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/locations/${params?.id}`)
      if (response.ok) {
        const data = await response.json()
        setLocation(data)
      } else if (response.status === 404) {
        setError('Location not found')
      } else {
        setError('Failed to load location')
      }
    } catch (error) {
      setError('An error occurred while loading the location')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!location) return
    
    if (!confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/locations')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete location')
      }
    } catch (error) {
      alert('An error occurred while deleting the location')
    }
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
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-brand-primary-text mb-3">
              {error}
            </h3>
            <Link
              href="/locations"
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover text-white rounded-lg transition-colors"
            >
              ← Back to Locations
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!location) {
    return null
  }

  const canManageLocations = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'
  const canDeleteLocations = session.user.role === 'ADMIN'

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
                    href="/locations"
                    className="p-2 bg-gray-900/5 hover rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <div className="p-2 bg-orange-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-brand-primary-text">
                      {location.name}
                    </h1>
                    <p className="text-white/50 hover:text-white/80 transition-colors">
                      Location Details
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                {canManageLocations && (
                  <button
                    onClick={() => setShowEditDialog(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Location
                  </button>
                )}
                {canDeleteLocations && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-brand-primary-text mb-4">
                  Location Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Building</label>
                    <p className="text-brand-primary-text">{location.building || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Floor</label>
                    <p className="text-brand-primary-text">{location.floor || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Room</label>
                    <p className="text-brand-primary-text">{location.room || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Capacity</label>
                    <p className="text-brand-primary-text">{location.capacity || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Description</label>
                    <p className="text-brand-primary-text">{location.description || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      location.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assets */}
              {location.assets.length > 0 && (
                <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6">
                  <h2 className="text-xl font-semibold text-brand-primary-text mb-4">
                    Assets ({location.assets.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {location.assets.slice(0, 8).map((asset) => (
                      <Link
                        key={asset.id}
                        href={`/assets/${asset.id}`}
                        className="flex items-center p-3 bg-gray-900/5/50 rounded-lg hover transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-brand-primary-text truncate">
                            {asset.name}
                          </p>
                          <p className="text-sm text-white/50 hover:text-white/80 transition-colors">
                            {asset.category} • {asset.status}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {location.assets.length > 8 && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/assets?location=${location.name}`}
                        className="text-blue-600 hover text-sm font-medium"
                      >
                        View all {location.assets.length} assets →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-brand-primary-text mb-4">
                  Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 hover:text-white/80 transition-colors">Assets</span>
                    <span className="font-semibold text-brand-primary-text">
                      {location._count.assets}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 hover:text-white/80 transition-colors">Asset Groups</span>
                    <span className="font-semibold text-brand-primary-text">
                      {location._count.assetGroups}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 hover:text-white/80 transition-colors">Transactions</span>
                    <span className="font-semibold text-brand-primary-text">
                      {location._count.assetTransactions}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-brand-primary-text mb-4">
                  Timestamps
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-white/50 hover:text-white/80 transition-colors">Created</span>
                    <p className="text-sm text-brand-primary-text">
                      {new Date(location.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-white/50 hover:text-white/80 transition-colors">Last Updated</span>
                    <p className="text-sm text-brand-primary-text">
                      {new Date(location.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <LocationDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={() => {
          fetchLocation()
          setShowEditDialog(false)
        }}
        location={location}
        mode="edit"
      />
    </div>
  )
}