'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
    asset: {
      id: string
      name: string
      category: string
      status: string
      imageUrl: string | null
    }
  }>
  _count: {
    members: number
  }
}

interface AssetGroupsResponse {
  groups: AssetGroup[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AssetGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<AssetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AssetGroup | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    active: 'true'
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
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

    fetchGroups()
  }, [status, router, filters, pagination.page])

  const fetchGroups = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.active && { active: filters.active })
      })

      const response = await fetch(`/api/asset-groups?${params}`)
      if (response.ok) {
        const data: AssetGroupsResponse = await response.json()
        setGroups(data.groups)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch asset groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this asset group? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/asset-groups/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchGroups()
      } else {
        alert('Failed to delete asset group')
      }
    } catch (error) {
      console.error('Failed to delete asset group:', error)
      alert('An error occurred while deleting the asset group')
    }
  }

  const handleEdit = (group: AssetGroup) => {
    setEditingGroup(group)
    setShowFormDialog(true)
  }

  const handleFormClose = () => {
    setShowFormDialog(false)
    setEditingGroup(null)
  }

  const handleFormSuccess = () => {
    fetchGroups()
    handleFormClose()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Asset Groups
                </h1>
              </div>
              <p className="text-base text-gray-600 dark:text-brand-secondary-text ml-11 max-w-2xl">
                Manage collections and bundles of related equipment
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFormDialog(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Group
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Asset Groups
            </h1>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{pagination.total}</span>
              </div>
              <button
                onClick={() => setShowFormDialog(true)}
                className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-brand-secondary-text mb-4">
            Manage collections and bundles of related equipment
          </p>
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/5 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 text-left active:scale-95 touch-manipulation transition-all"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="text-sm font-medium text-brand-primary-text">
                {Object.values(filters).some(value => value && value !== '')
                  ? 'Filters Applied'
                  : 'Show Filters'
                }
              </span>
              {Object.values(filters).some(value => value && value !== '') && (
                <span className="px-2 py-1 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-full">
                  {Object.values(filters).filter(value => value && value !== '').length}
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
        <div className={`bg-gray-900/5 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8 ${!filtersExpanded ? 'hidden md:block' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                Search
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search groups..."
                className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="Filter by category..."
                className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 touch-manipulation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                Status
              </label>
              <select
                name="active"
                value={filters.active}
                onChange={handleFilterChange}
                className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text touch-manipulation"
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
          {groups.map((group) => (
            <div key={group.id} className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-brand-primary-text mb-1">{group.name}</h3>
                  {group.description && (
                    <p className="text-xs text-gray-600 dark:text-brand-secondary-text">{group.description}</p>
                  )}
                </div>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  group.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
                }`}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Assets:</span>
                  <span className="ml-1 font-semibold text-brand-primary-text">{group._count.members}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="ml-1 text-brand-primary-text">{group.category || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Location:</span>
                  <span className="ml-1 text-brand-primary-text">{group.location || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created by:</span>
                  <span className="ml-1 text-brand-primary-text">{group.createdBy.name || 'Unknown'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/asset-groups/${group.id}`}
                  className="flex-1 px-3 py-2 text-center text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors active:scale-95 touch-manipulation"
                >
                  View
                </Link>
                <button
                  onClick={() => handleEdit(group)}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 touch-manipulation"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="px-3 py-2 text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors active:scale-95 touch-manipulation"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block">
          <div className="bg-gray-900/5 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-900/5 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Assets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/5 dark:bg-white/5 divide-y divide-gray-300 dark:divide-gray-700">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-white/10 dark:hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                            {group.name}
                          </div>
                          {group.description && (
                            <div className="text-sm text-gray-600 dark:text-brand-secondary-text truncate max-w-xs">
                              {group.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                          {group._count.members}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-brand-primary-text">
                          {group.category || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-brand-primary-text">
                          {group.location || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300'
                        }`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-brand-secondary-text">
                          {group.createdBy.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-1">
                          <Link
                            href={`/asset-groups/${group.id}`}
                            className="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleEdit(group)}
                            className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Desktop Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-300/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} asset groups
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/10 dark:hover:bg-white/10 bg-white/5 dark:bg-white/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-blue-600 text-white">
                      {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/10 dark:hover:bg-white/10 bg-white/5 dark:bg-white/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Pagination */}
        {groups.length > 0 && pagination.pages > 1 && (
          <div className="md:hidden mb-6">
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600 dark:text-brand-secondary-text">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="flex-1 px-4 py-3 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 bg-white/80 dark:bg-white/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
                >
                  ← Previous
                </button>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="flex-1 px-4 py-3 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 bg-white/80 dark:bg-white/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Groups Content */}
        {groups.length > 0 ? (
          <div>
            {/* Content rendered above */}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg className="w-12 h-12 text-blue-400 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
              No asset groups found
            </h3>
            <p className="text-gray-800 dark:text-white/50 hover:text-white/80 transition-colors max-w-sm mx-auto leading-relaxed mb-6">
              Create your first asset group to organize collections and bundles of related equipment.
            </p>
            <button
              onClick={() => setShowFormDialog(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Asset Group
            </button>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <AssetGroupFormDialog
        isOpen={showFormDialog}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        group={editingGroup}
      />
    </div>
  )
}