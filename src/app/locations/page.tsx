'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import LocationDialog from '@/components/locations/location-dialog'
import LocationViewModal from '@/components/locations/location-view-modal'

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
  _count: {
    assets: number
    assetGroups: number
  }
}

interface LocationsResponse {
  locations: Location[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function LocationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    building: '',
    active: 'true'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchLocations()
  }, [status, router, filters, pagination.page])

  const fetchLocations = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.building && { building: filters.building }),
        ...(filters.active && { active: filters.active })
      })

      const response = await fetch(`/api/locations?${params}`)
      if (response.ok) {
        const data: LocationsResponse = await response.json()
        setLocations(data.locations)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchLocations()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete location')
      }
    } catch (error) {
      console.error('Failed to delete location:', error)
      alert('An error occurred while deleting the location')
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

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

  if (!session) {
    return null
  }

  const canManageLocations = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-900 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Locations
                  </h1>
                </div>
                <p className="text-gray-800 dark:text-gray-400 ml-11 max-w-2xl">
                  Manage asset locations and room tracking ({pagination.total} total)
                </p>
              </div>
              <div className="flex space-x-3">
                {canManageLocations && (
                  <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Location
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Building
                </label>
                <input
                  type="text"
                  name="building"
                  value={filters.building}
                  onChange={handleFilterChange}
                  placeholder="Filter by building..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="active"
                  value={filters.active}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Locations Table */}
          {locations.length > 0 ? (
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-700/50 shadow-xl shadow-gray-200/20 dark:shadow-gray-900/50 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300/50 dark:divide-gray-700/50">
                  <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:from-gray-700/30 dark:to-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                        Building/Floor/Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                        Assets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 dark:bg-white/5 divide-y divide-gray-300/30 dark:divide-gray-700/30">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover:bg-white/10/50 dark:hover:bg-white/10/30 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                              {location.name}
                            </div>
                            {location.description && (
                              <div className="text-sm text-gray-700 dark:text-brand-secondary-text truncate max-w-xs">
                                {location.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                            {[location.building, location.floor, location.room].filter(Boolean).join(' / ') || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                              {location._count.assets}
                            </span>
                            {location._count.assetGroups > 0 && (
                              <span className="text-xs text-gray-700 dark:text-brand-secondary-text">
                                (+{location._count.assetGroups} groups)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-brand-primary-text">
                            {location.capacity || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
                          }`}>
                            {location.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => {
                                setSelectedLocation(location)
                                setShowViewModal(true)
                              }}
                              className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            >
                              View
                            </button>
                            {canManageLocations && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedLocation(location)
                                    setShowEditDialog(true)
                                  }}
                                  className="px-3 py-1.5 text-gray-800 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 rounded-md transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(location.id)}
                                  className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-orange-400 dark:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                No locations found
              </h3>
              <p className="text-gray-800 dark:text-gray-400 max-w-sm mx-auto leading-relaxed mb-6">
                Get started by creating your first location.
              </p>
              {canManageLocations && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:scale-[1.02]"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Your First Location
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary & Pagination */}
          {!loading && locations.length > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} locations
              </div>
              
              {/* Pagination */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Location Dialog */}
      <LocationDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={() => {
          fetchLocations()
          setShowCreateDialog(false)
        }}
        mode="create"
      />

      {/* Edit Location Dialog */}
      <LocationDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setSelectedLocation(null)
        }}
        onSave={() => {
          fetchLocations()
          setShowEditDialog(false)
          setSelectedLocation(null)
        }}
        location={selectedLocation}
        mode="edit"
      />

      {/* View Location Modal */}
      <LocationViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setSelectedLocation(null)
        }}
        onEdit={() => {
          setShowViewModal(false)
          setShowEditDialog(true)
        }}
        onDelete={() => {
          if (selectedLocation) {
            handleDelete(selectedLocation.id)
            setShowViewModal(false)
            setSelectedLocation(null)
          }
        }}
        location={selectedLocation}
        canManage={canManageLocations}
        canDelete={session.user.role === 'ADMIN'}
      />
    </div>
  )
}