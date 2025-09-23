'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      {/* Header */}
      <div className="bg-gray-900/5 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-white/60 dark:text-white/60 hover:text-slate-500 dark:hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-brand-primary-text">Department Management</h1>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Manage organizational departments</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewDepartmentForm(true)}
              className="bg-blue-600 hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Department</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Departments
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Show Users
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showUsers}
                  onChange={(e) => setShowUsers(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-300">Include user details</span>
              </label>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setActiveFilter('')
                  setShowUsers(false)
                }}
                className="w-full px-4 py-2 text-brand-primary-text hover border border-gray-600 rounded-lg hover transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* New Department Form Modal */}
        {showNewDepartmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900/5 rounded-lg shadow-xl max-w-md w-full mx-4">
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
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewDepartmentForm(false)
                        setCreateError('')
                      }}
                      className="px-4 py-2 text-gray-300 hover border border-gray-600 rounded-lg hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-4 py-2 bg-blue-600 hover disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
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

        {/* Departments Table */}
        <div className="bg-gray-900/5 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-900/5">
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
              <tbody className="bg-gray-900/5 divide-y divide-gray-300">
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