'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

export default function PresetConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<PresetCategory[]>([])
  const [departments, setDepartments] = useState<PresetDepartment[]>([])
  const [loading, setLoading] = useState(true)

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PresetCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  // Department form state
  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<PresetDepartment | null>(null)
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MANAGER') {
      router.push('/dashboard')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, session, router])

  const fetchData = async () => {
    try {
      const [categoriesRes, departmentsRes] = await Promise.all([
        fetch('/api/preset-categories'),
        fetch('/api/preset-departments')
      ])

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }

      if (departmentsRes.ok) {
        const data = await departmentsRes.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = () => {
    setCategoryForm({ name: '', description: '' })
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: PresetCategory) => {
    setCategoryForm({ name: category.name, description: category.description || '' })
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleSaveCategory = async () => {
    try {
      const url = editingCategory
        ? `/api/preset-categories/${editingCategory.id}`
        : '/api/preset-categories'

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (response.ok) {
        setShowCategoryForm(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleToggleCategoryStatus = async (category: PresetCategory) => {
    try {
      const response = await fetch(`/api/preset-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...category, isActive: !category.isActive })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling category status:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/preset-categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleCreateDepartment = () => {
    setDepartmentForm({ name: '', description: '' })
    setEditingDepartment(null)
    setShowDepartmentForm(true)
  }

  const handleEditDepartment = (department: PresetDepartment) => {
    setDepartmentForm({ name: department.name, description: department.description || '' })
    setEditingDepartment(department)
    setShowDepartmentForm(true)
  }

  const handleSaveDepartment = async () => {
    try {
      const url = editingDepartment
        ? `/api/preset-departments/${editingDepartment.id}`
        : '/api/preset-departments'

      const method = editingDepartment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentForm)
      })

      if (response.ok) {
        setShowDepartmentForm(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error saving department:', error)
    }
  }

  const handleToggleDepartmentStatus = async (department: PresetDepartment) => {
    try {
      const response = await fetch(`/api/preset-departments/${department.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...department, isActive: !department.isActive })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling department status:', error)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      const response = await fetch(`/api/preset-departments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting department:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Preset Configuration</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="card-over-pattern p-6 rounded-xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Categories</h2>
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Category
            </button>
          </div>

          <div className="space-y-3">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-400 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${category.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleCategoryStatus(category)}
                    className="px-3 py-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded text-sm transition-colors"
                  >
                    {category.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments Section */}
        <div className="card-over-pattern p-6 rounded-xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Departments</h2>
            <button
              onClick={handleCreateDepartment}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Department
            </button>
          </div>

          <div className="space-y-3">
            {departments.map(department => (
              <div
                key={department.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{department.name}</h3>
                    {department.description && (
                      <p className="text-sm text-gray-400 mt-1">{department.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${department.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {department.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleDepartmentStatus(department)}
                    className="px-3 py-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded text-sm transition-colors"
                  >
                    {department.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(department.id)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCategory}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Form Modal */}
      {showDepartmentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {editingDepartment ? 'Edit Department' : 'New Department'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveDepartment}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowDepartmentForm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
