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
  const [filtersExpanded, setFiltersExpanded] = useState(false)

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

  const canManageLocations = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-brand-secondary-text bg-clip-text text-transparent">
                    Locations
                  </h1>
                </div>
                <p className="text-brand-primary-text ml-11 max-w-2xl">
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

          {/* Mobile Header */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Locations
              </h1>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{pagination.total}</span>
                </div>
                {canManageLocations && (
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg font-medium transition-all duration-200 active:scale-95 touch-manipulation"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-brand-secondary-text mb-4">
              Manage asset locations and room tracking
            </p>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/5 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 text-left active:scale-95 touch-manipulation transition-all"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <span className="text-sm font-medium text-brand-primary-text">
                  {(filters.search || filters.building || filters.active !== '') ? 'Filters Applied' : 'Show Filters'}
                </span>
                {(filters.search || filters.building || filters.active !== '') && (
                  <span className="px-2 py-1 text-xs bg-orange-600 dark:bg-orange-500 text-white rounded-full">
                    {[filters.search, filters.building, filters.active !== '' ? 'Active' : ''].filter(Boolean).length}
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className={`bg-gray-900/5 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-4 mb-6 ${!filtersExpanded ? 'hidden md:block' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search locations..."
                    className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent touch-manipulation"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50 hover:text-white/80 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                  Building
                </label>
                <input
                  type="text"
                  name="building"
                  value={filters.building}
                  onChange={handleFilterChange}
                  placeholder="Filter by building..."
                  className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                  Status
                </label>
                <select
                  name="active"
                  value={filters.active}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent touch-manipulation"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-3 mb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
                <span className="ml-2 text-gray-600 dark:text-brand-secondary-text">Loading locations...</span>
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No locations found</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              locations.map((location) => (
                <div key={location.id} className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-brand-primary-text mb-1">{location.name}</h3>
                      {location.description && (
                        <p className="text-xs text-gray-600 dark:text-brand-secondary-text">{location.description}</p>
                      )}
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      location.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Building:</span>
                      <span className="ml-1 text-brand-primary-text">{location.building || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Floor:</span>
                      <span className="ml-1 text-brand-primary-text">{location.floor || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Room:</span>
                      <span className="ml-1 text-brand-primary-text">{location.room || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Assets:</span>
                      <span className="ml-1 font-semibold text-brand-primary-text">{location._count?.assets || 0}</span>
                    </div>
                    {location.capacity && (
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">Capacity:</span>
                        <span className="ml-1 text-brand-primary-text">{location.capacity}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedLocation(location)
                        setShowViewModal(true)
                      }}
                      className="flex-1 px-3 py-2 text-center text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors active:scale-95 touch-manipulation"
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
                          className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 touch-manipulation"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location)}
                          className="px-3 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors active:scale-95 touch-manipulation"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          {locations.length > 0 ? (
            <div className="hidden md:block bg-gray-900/5 backdrop-blur-sm rounded-2xl border border-gray-600/50 shadow-xl shadow-gray-200/20 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300/50">
                  <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                        Building/Floor/Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                        Assets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/50 divide-y divide-gray-300/30">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-brand-primary-text">
                              {location.name}
                            </div>
                            {location.description && (
                              <div className="text-sm text-gray-600 dark:text-brand-secondary-text truncate max-w-xs">
                                {location.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-brand-primary-text">
                            {[location.building, location.floor, location.room].filter(Boolean).join(' / ') || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-brand-primary-text">
                              {location._count?.assets || 0}
                            </span>
                            {(location._count?.assetGroups || 0) > 0 && (
                              <span className="text-xs text-gray-600 dark:text-brand-secondary-text">
                                (+{location._count?.assetGroups || 0} groups)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-brand-primary-text">
                            {location.capacity || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
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
                              className="px-3 py-1.5 text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 rounded-md transition-colors"
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
                                  className="px-3 py-1.5 text-brand-primary-text hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 rounded-md transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(location.id)}
                                  className="px-3 py-1.5 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 rounded-md transition-colors"
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
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-brand-secondary-text bg-clip-text text-transparent mb-3">
                No locations found
              </h3>
              <p className="text-brand-primary-text max-w-sm mx-auto leading-relaxed mb-6">
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
              <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} locations
              </div>
              
              {/* Pagination */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm border border-gray-600 rounded-lg hover bg-gray-900/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm border border-gray-600 rounded-lg bg-gray-900/5 text-slate-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm border border-gray-600 rounded-lg hover bg-gray-900/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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