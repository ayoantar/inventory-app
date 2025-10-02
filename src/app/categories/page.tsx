'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/navbar'

interface Category {
  id: string
  name: string
  description: string
  isEditable?: boolean
}

interface PresetCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface PresetDepartment {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

interface CategoriesResponse {
  categories: Category[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

type TabType = 'asset' | 'preset'

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('asset')
  const [categories, setCategories] = useState<Category[]>([])
  const [presetCategories, setPresetCategories] = useState<PresetCategory[]>([])
  const [presetDepartments, setPresetDepartments] = useState<PresetDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingPresetCategory, setEditingPresetCategory] = useState<PresetCategory | null>(null)
  const [editingPresetDepartment, setEditingPresetDepartment] = useState<PresetDepartment | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchExpanded, setSearchExpanded] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    const userRole = (session?.user as any)?.role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      router.push('/dashboard')
      return
    }

    fetchCategories()
  }, [status, router, session])

  const fetchCategories = async () => {
    try {
      const [categoriesRes, presetCategoriesRes, presetDepartmentsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/preset-categories'),
        fetch('/api/preset-departments')
      ])

      if (categoriesRes.ok) {
        const data: CategoriesResponse = await categoriesRes.json()
        setCategories(data.categories.map(cat => ({
          ...cat,
          isEditable: !['CAMERA', 'LENS', 'LIGHTING', 'AUDIO', 'COMPUTER', 'STORAGE', 'ACCESSORY', 'FURNITURE', 'SOFTWARE', 'OTHER'].includes(cat.id)
        })))
      }

      if (presetCategoriesRes.ok) {
        const data = await presetCategoriesRes.json()
        setPresetCategories(data.categories || [])
      }

      if (presetDepartmentsRes.ok) {
        const data = await presetDepartmentsRes.json()
        setPresetDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({ name: '', description: '' })
    setEditingCategory(null)
    setEditingPresetCategory(null)
    setEditingPresetDepartment(null)
    setError('')
    setShowAddModal(true)
  }

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description })
    setEditingCategory(category)
    setEditingPresetCategory(null)
    setEditingPresetDepartment(null)
    setError('')
    setShowAddModal(true)
  }

  const handleEditPresetCategory = (category: PresetCategory) => {
    setFormData({ name: category.name, description: category.description || '' })
    setEditingPresetCategory(category)
    setEditingCategory(null)
    setEditingPresetDepartment(null)
    setError('')
    setShowAddModal(true)
  }

  const handleEditPresetDepartment = (department: PresetDepartment) => {
    setFormData({ name: department.name, description: department.description || '' })
    setEditingPresetDepartment(department)
    setEditingCategory(null)
    setEditingPresetCategory(null)
    setError('')
    setShowAddModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      let url = ''
      let method = 'POST'

      if (editingCategory) {
        url = `/api/categories/${editingCategory.id}`
        method = 'PUT'
      } else if (editingPresetCategory) {
        url = `/api/preset-categories/${editingPresetCategory.id}`
        method = 'PUT'
      } else if (editingPresetDepartment) {
        url = `/api/preset-departments/${editingPresetDepartment.id}`
        method = 'PUT'
      } else if (activeTab === 'preset') {
        // Determine if creating category or department based on context
        // For now, default to category
        url = '/api/preset-categories'
      } else {
        url = '/api/categories'
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        fetchCategories()
        setShowAddModal(false)
        setEditingCategory(null)
        setEditingPresetCategory(null)
        setEditingPresetDepartment(null)
        setFormData({ name: '', description: '' })
        setError('')
      } else {
        setError(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?\n\nThis action cannot be undone.`)) return

    try {
      const response = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        fetchCategories()
        alert(`Category "${category.name}" deleted successfully.`)
      } else {
        alert(`Error: ${data.error || 'Failed to delete category'}`)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category. Please try again.')
    }
  }

  const handleDeletePresetCategory = async (category: PresetCategory) => {
    if (!confirm(`Delete preset category "${category.name}"?\n\nThis action cannot be undone.`)) return

    try {
      const response = await fetch(`/api/preset-categories/${category.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchCategories()
        alert(`Preset category "${category.name}" deleted successfully.`)
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Failed to delete preset category'}`)
      }
    } catch (error) {
      console.error('Failed to delete preset category:', error)
      alert('Failed to delete preset category. Please try again.')
    }
  }

  const handleDeletePresetDepartment = async (department: PresetDepartment) => {
    if (!confirm(`Delete preset department "${department.name}"?\n\nThis action cannot be undone.`)) return

    try {
      const response = await fetch(`/api/preset-departments/${department.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchCategories()
        alert(`Preset department "${department.name}" deleted successfully.`)
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || 'Failed to delete preset department'}`)
      }
    } catch (error) {
      console.error('Failed to delete preset department:', error)
      alert('Failed to delete preset department. Please try again.')
    }
  }

  const handleTogglePresetCategoryStatus = async (category: PresetCategory) => {
    try {
      const response = await fetch(`/api/preset-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...category, isActive: !category.isActive })
      })

      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Error toggling category status:', error)
    }
  }

  const handleTogglePresetDepartmentStatus = async (department: PresetDepartment) => {
    try {
      const response = await fetch(`/api/preset-departments/${department.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...department, isActive: !department.isActive })
      })

      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Error toggling department status:', error)
    }
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPresetCategories = presetCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredPresetDepartments = presetDepartments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-brand-primary-text">Manage Categories</h1>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">{categories.length} categories</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-sm active:scale-95 touch-manipulation transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-primary-text">Categories</h1>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">{categories.length} total</p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Category</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Mobile Search Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setSearchExpanded(!searchExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/5 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 text-left active:scale-95 touch-manipulation transition-all"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-medium text-brand-primary-text">
                {searchTerm ? `Searching: "${searchTerm}"` : 'Search Categories'}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${searchExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Search Section */}
        <div className={`bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-700 p-4 mb-4 ${!searchExpanded ? 'hidden md:block' : ''}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm touch-manipulation"
              />
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-3 md:py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm active:scale-95 touch-manipulation"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-700 mb-4 overflow-hidden">
          <div className="flex border-b border-gray-300 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('asset')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'asset'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Asset Categories
            </button>
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preset'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Preset Categories
            </button>
          </div>
        </div>

        {/* Asset Categories Tab */}
        {activeTab === 'asset' && (
        <>
        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3 mb-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-brand-primary-text">{category.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 mt-1">
                      {category.id}
                    </span>
                  </div>
                </div>
                {!category.isEditable && (
                  <div className="flex items-center ml-2">
                    <svg className="w-3 h-3 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-gray-500">System</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {category.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-brand-secondary-text">{category.description}</p>
                </div>
              )}

              {/* Actions */}
              {category.isEditable && (
                <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 px-3 py-2 text-center text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors active:scale-95 touch-manipulation"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="flex-1 px-3 py-2 text-center text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors active:scale-95 touch-manipulation"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm divide-y divide-gray-300">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-brand-primary-text">
                          {category.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-brand-primary-text">
                        {category.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-brand-secondary-text">
                      {category.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        {category.isEditable ? (
                          <>
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-indigo-600 hover transition-colors font-medium"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="text-red-600 hover transition-colors font-medium"
                            >
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-xs text-white/50 hover:text-white/80 transition-colors">System</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCategories.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-brand-primary-text">
                {searchTerm ? 'No categories found' : 'Ready to organize your assets?'}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                {searchTerm ? 'Try adjusting your search terms or clear the search to see all categories.' : 'Create custom categories to better organize your inventory beyond the system defaults.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Custom Category
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}

        {/* Preset Categories Tab */}
        {activeTab === 'preset' && (
        <>
        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3 mb-6">
          {filteredPresetCategories.map((category) => (
            <div key={category.id} className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-brand-primary-text">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-400 mt-1">{category.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ml-2 ${category.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEditPresetCategory(category)}
                  className="flex-1 px-3 py-2 text-center text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleTogglePresetCategoryStatus(category)}
                  className="flex-1 px-3 py-2 text-center text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {category.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeletePresetCategory(category)}
                  className="flex-1 px-3 py-2 text-center text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Delete
                </button>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/60 dark:text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm divide-y divide-gray-300">
                {filteredPresetCategories.map((category) => (
                  <tr key={category.id} className="hover transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-brand-primary-text">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-brand-secondary-text">
                      {category.description || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${category.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditPresetCategory(category)}
                          className="text-indigo-600 hover transition-colors font-medium"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePresetCategoryStatus(category)}
                          className="text-gray-600 hover transition-colors font-medium"
                        >
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeletePresetCategory(category)}
                          className="text-red-600 hover transition-colors font-medium"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPresetCategories.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-brand-primary-text">
                {searchTerm ? 'No preset categories found' : 'No preset categories yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a preset category.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Preset Category
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg p-4 md:p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-brand-primary-text">
                {editingCategory ? 'Edit Asset Category' : editingPresetCategory ? 'Edit Preset Category' : editingPresetDepartment ? 'Edit Preset Department' : activeTab === 'preset' ? 'Add Preset Category' : 'Add Asset Category'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/50 hover:text-white/80 transition-colors hover"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={saving}
                  className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  placeholder="e.g., Drones, Cables, Stands"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={saving}
                  rows={3}
                  className="w-full px-3 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  placeholder="Brief description of what assets belong in this category..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">About Category Codes</p>
                    <p>A unique code will be automatically generated from your category name (e.g., "Drone Equipment" → "DROEQU"). This code is used in asset numbering like LSVR-DROEQU-0001.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="w-full md:w-auto px-4 py-3 md:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}
                className="w-full md:w-auto px-4 py-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 touch-manipulation"
              >
                {saving && (
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z" />
                  </svg>
                )}
                {saving ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}