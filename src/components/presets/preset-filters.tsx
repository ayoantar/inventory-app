'use client'

import { useState } from 'react'

interface PresetFiltersProps {
  filters: {
    search: string
    category: string
    department: string
    isActive: string
  }
  onFilterChange: (filters: any) => void
}

const categories = [
  'Camera Kit',
  'Audio Setup', 
  'Lighting Kit',
  'Conference Setup',
  'Video Production',
  'Photography',
  'Live Streaming',
  'Event Setup'
]

const departments = [
  'Media Production',
  'IT',
  'Marketing',
  'Events',
  'Education',
  'Operations'
]

export default function PresetFilters({
  filters,
  onFilterChange
}: PresetFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const updateFilter = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    })
  }

  const resetFilters = () => {
    onFilterChange({
      search: '',
      category: '',
      department: '',
      isActive: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search presets..."
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

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => updateFilter('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
          >
            <option value="">All Departments</option>
            {departments.map(department => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.isActive}
            onChange={(e) => updateFilter('isActive', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-white/5 dark:text-brand-primary-text"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}