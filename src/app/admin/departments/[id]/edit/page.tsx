'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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
}

export default function EditDepartment() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string

  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    isActive: true
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin or manager
    const userRole = (session.user as any)?.role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      router.push('/dashboard')
      return
    }

    fetchDepartment()
  }, [status, session, router, departmentId])

  const fetchDepartment = async () => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`)
      if (response.ok) {
        const department = await response.json()
        setDepartment(department)
        setFormData({
          name: department.name || '',
          description: department.description || '',
          manager: department.manager || '',
          isActive: department.isActive
        })
      } else {
        setError('Department not found')
      }
    } catch (error) {
      console.error('Failed to fetch department:', error)
      setError('Failed to load department')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/departments')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update department')
      }
    } catch (error) {
      console.error('Failed to update department:', error)
      setError('Failed to update department')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/departments')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete department')
      }
    } catch (error) {
      console.error('Failed to delete department:', error)
      setError('Failed to delete department')
    } finally {
      setSaving(false)
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

  if (error && !department) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-primary-text mb-4">Department Not Found</h1>
          <Link
            href="/admin/departments"
            className="text-blue-600 hover"
          >
            ← Back to Departments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      {/* Header */}
      <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover text-sm font-medium mb-2 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-brand-primary-text">
                Edit Department
              </h1>
              {department && (
                <p className="text-brand-primary-text mt-1">
                  {department.name} • {department._count.users} user{department._count.users !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter department description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Manager
              </label>
              <input
                type="text"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter manager name"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-300">
                  Department is active
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-600 hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Delete Department
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-300 hover text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}