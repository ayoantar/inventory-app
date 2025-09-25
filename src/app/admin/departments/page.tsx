'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'

interface Department {
  id: string
  name: string
  description: string | null
  manager: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    users: number
  }
  users?: {
    id: string
    name: string | null
    email: string | null
    role: string
    isActive: boolean
  }[]
}

export default function DepartmentManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showUsers, setShowUsers] = useState(false)
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false)
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    manager: '',
    isActive: true
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      router.push('/dashboard')
      return
    }

    fetchDepartments()
  }, [session, status, router])

  const fetchDepartments = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (activeFilter) params.append('active', activeFilter)
      if (showUsers) params.append('includeUsers', 'true')

      const response = await fetch(`/api/departments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDepartments()
    }
  }, [searchTerm, activeFilter, showUsers])

  const toggleDepartmentStatus = async (departmentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        fetchDepartments()
      }
    } catch (error) {
      console.error('Failed to update department status:', error)
    }
  }

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDepartment)
      })

      const data = await response.json()

      if (response.ok) {
        setShowNewDepartmentForm(false)
        setNewDepartment({ name: '', description: '', manager: '', isActive: true })
        fetchDepartments()
      } else {
        setCreateError(data.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Failed to create department:', error)
      setCreateError('Failed to create department. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const deleteDepartment = async (departmentId: string, departmentName: string) => {
    if (!confirm(`Are you sure you want to delete the department "${departmentName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        fetchDepartments()
      } else {
        alert(data.error || 'Failed to delete department')
      }
    } catch (error) {
      console.error('Failed to delete department:', error)
      alert('Failed to delete department. Please try again.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = (session.user as any).role
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Department Management
                </h1>
              </div>
              <p className="text-base text-gray-600 dark:text-brand-secondary-text ml-11 max-w-2xl">
                Manage organizational departments and team structures
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewDepartmentForm(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Department
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Departments
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                </svg>
                <span>{departments.length}</span>
              </div>
              <button
                onClick={() => setShowNewDepartmentForm(true)}
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
            Manage organizational departments and team structures
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
                {(searchTerm || activeFilter || showUsers) ? 'Filters Applied' : 'Show Filters'}
              </span>
              {(searchTerm || activeFilter || showUsers) && (
                <span className="px-2 py-1 text-xs bg-blue-600 dark:bg-blue-500 text-white rounded-full">
                  {[searchTerm, activeFilter, showUsers].filter(Boolean).length}
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
        <div className={`bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 ${!filtersExpanded ? 'hidden md:block' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                Search Departments
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400"
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
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                Show Users
              </label>
              <label className="flex items-center py-2">
                <input
                  type="checkbox"
                  checked={showUsers}
                  onChange={(e) => setShowUsers(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded touch-manipulation"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Include user details</span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setActiveFilter('')
                  setShowUsers(false)
                }}
                className="w-full px-4 py-3 md:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95 touch-manipulation"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* New Department Form Modal */}
        {showNewDepartmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-brand-primary-text">Add New Department</h3>
                  <button
                    onClick={() => {
                      setShowNewDepartmentForm(false)
                      setCreateError('')
                    }}
                    className="text-white/50 hover:text-white/80 transition-colors hover"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {createError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                )}

                <form onSubmit={createDepartment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                      placeholder="Enter department name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                      placeholder="Enter department description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Manager
                    </label>
                    <input
                      type="text"
                      value={newDepartment.manager}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, manager: e.target.value }))}
                      className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                      placeholder="Enter manager name (optional)"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newDepartment.isActive}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-300">
                      Department is active
                    </label>
                  </div>

                  <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewDepartmentForm(false)
                        setCreateError('')
                      }}
                      className="w-full md:w-auto px-4 py-3 md:py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95 touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="w-full md:w-auto px-4 py-3 md:py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
                    >
                      {createLoading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>{createLoading ? 'Creating...' : 'Create Department'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3 mb-6">
          {departments.map((department) => (
            <div key={department.id} className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-brand-primary-text">{department.name}</h3>
                    {department.description && (
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text mt-1">{department.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleDepartmentStatus(department.id, department.isActive)}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors active:scale-95 touch-manipulation ${
                    department.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {department.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Manager:</span>
                  <span className="ml-1 text-brand-primary-text">{department.manager || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Users:</span>
                  <span className="ml-1 font-semibold text-brand-primary-text">{department._count.users}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="ml-1 text-brand-primary-text">{new Date(department.createdAt).toLocaleDateString()}</span>
                </div>
                {showUsers && department.users && department.users.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Members:</span>
                    <p className="text-xs text-brand-primary-text mt-1">
                      {department.users.slice(0, 3).map(user => user.name || user.email).join(', ')}
                      {department.users.length > 3 && ` +${department.users.length - 3} more`}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href={`/admin/departments/${department.id}/edit`}
                  className="flex-1 px-3 py-2 text-center text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors active:scale-95 touch-manipulation"
                >
                  Edit
                </Link>
                {userRole === 'ADMIN' && (
                  <button
                    onClick={() => deleteDepartment(department.id, department.name)}
                    disabled={department._count.users > 0}
                    className={`flex-1 px-3 py-2 text-center text-sm font-medium rounded-md transition-colors active:scale-95 touch-manipulation ${
                      department._count.users > 0
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    }`}
                    title={department._count.users > 0 ? 'Cannot delete department with users' : 'Delete department'}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm divide-y divide-gray-300">
                {departments.map((department) => (
                  <tr key={department.id} className="hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-brand-primary-text">
                          {department.name}
                        </div>
                        {department.description && (
                          <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                            {department.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-brand-secondary-text">
                      {department.manager || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-brand-primary-text">
                        {department._count.users} users
                      </div>
                      {showUsers && department.users && department.users.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-brand-secondary-text mt-1">
                          {department.users.slice(0, 3).map(user => user.name || user.email).join(', ')}
                          {department.users.length > 3 && ` +${department.users.length - 3} more`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleDepartmentStatus(department.id, department.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          department.isActive
                            ? 'bg-green-100 text-green-800 hover'
                            : 'bg-red-100 text-red-800 hover'
                        }`}
                      >
                        {department.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-brand-secondary-text">
                      {new Date(department.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/departments/${department.id}/edit`}
                        className="text-blue-600 hover transition-colors"
                      >
                        Edit
                      </Link>
                      {userRole === 'ADMIN' && (
                        <button
                          onClick={() => deleteDepartment(department.id, department.name)}
                          className="text-red-600 hover transition-colors"
                          disabled={department._count.users > 0}
                          title={department._count.users > 0 ? 'Cannot delete department with users' : 'Delete department'}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {departments.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2M7 21h2m-2 0H3m2-8h12m-10 0v6m4-6v6m4-6v6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No departments found</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                Get started by creating a new department.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowNewDepartmentForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Department
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}