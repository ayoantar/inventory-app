'use client'

import { useState, useEffect } from 'react'
import { AssetCategory, AssetStatus, AssetCondition } from '../../../generated/prisma'

interface Client {
  id: string
  name: string
  code: string
}

interface Category {
  id: string
  name: string
  description?: string
  icon: string
  isCustom: boolean
}

interface AdvancedFiltersProps {
  filters: {
    search: string
    category: string
    status: string
    condition: string
    minPrice: string
    maxPrice: string
    startDate: string
    endDate: string
    location: string
    manufacturer: string
    client: string
  }
  onFiltersChange: (filters: any) => void
  onApply: () => void
  onReset: () => void
  isExpanded: boolean
  onToggle: () => void
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  isExpanded,
  onToggle
}: AdvancedFiltersProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  useEffect(() => {
    fetchClients()
    fetchCategories()
  }, [])

  const fetchClients = async () => {
    try {
      setLoadingClients(true)
      const response = await fetch('/api/clients?active=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-gray-900/5 rounded-lg shadow border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-brand-primary-text">Search & Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.values(filters).filter(value => value !== '').length} active
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="text-gray-600 dark:text-brand-secondary-text hover transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 border-b border-gray-700">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const newFilters = { ...filters, status: filters.status === 'AVAILABLE' ? '' : 'AVAILABLE' }
                onFiltersChange(newFilters)
                onApply()
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.status === 'AVAILABLE'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-900 hover text-brand-primary-text border border-gray-600 shadow-sm'
              }`}
            >
              🟢 Available
            </button>
            <button
              onClick={() => {
                const newFilters = { ...filters, status: filters.status === 'CHECKED_OUT' ? '' : 'CHECKED_OUT' }
                onFiltersChange(newFilters)
                onApply()
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.status === 'CHECKED_OUT'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-gray-900 hover text-brand-primary-text border border-gray-600 shadow-sm'
              }`}
            >
              🟡 Checked Out
            </button>
            <button
              onClick={() => {
                const newFilters = { ...filters, status: filters.status === 'IN_MAINTENANCE' ? '' : 'IN_MAINTENANCE' }
                onFiltersChange(newFilters)
                onApply()
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.status === 'IN_MAINTENANCE'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-gray-900 hover text-brand-primary-text border border-gray-600 shadow-sm'
              }`}
            >
              🔴 In Maintenance
            </button>
            {categories.slice(0, 2).map(category => (
              <button
                key={category.id}
                onClick={() => {
                  const newFilters = { ...filters, category: filters.category === category.id ? '' : category.id }
                  onFiltersChange(newFilters)
                  onApply()
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.category === category.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-900 hover text-brand-primary-text border border-gray-600 shadow-sm'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
            <button
              onClick={() => {
                const newFilters = { ...filters, condition: filters.condition === 'NEEDS_REPAIR' ? '' : 'NEEDS_REPAIR' }
                onFiltersChange(newFilters)
                onApply()
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.condition === 'NEEDS_REPAIR'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-gray-900 hover text-brand-primary-text border border-gray-600 shadow-sm'
              }`}
            >
              🔧 Needs Repair
            </button>
            <button
              onClick={() => {
                if (filters.startDate && filters.endDate) {
                  // If dates are set, clear them
                  onFiltersChange({ 
                    ...filters, 
                    startDate: '',
                    endDate: ''
                  })
                } else {
                  // If dates are not set, set to last 30 days
                  const today = new Date()
                  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
                  onFiltersChange({ 
                    ...filters, 
                    startDate: thirtyDaysAgo.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  })
                }
                onApply()
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.startDate && filters.endDate
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-gray-900 hover text-brand-primary-text border border-gray-600 shadow-sm'
              }`}
            >
              📅 Recent (30 days)
            </button>
          </div>
        </div>
      </div>

      {/* Basic Search */}
      <div className="p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
              Search Assets
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Search by name, serial number, barcode, manufacturer..."
              className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={onApply}
              className="bg-blue-600 hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Search
            </button>
            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="text-gray-600 dark:text-brand-secondary-text hover px-4 py-2 text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-700 bg-gray-900/5/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="IN_MAINTENANCE">In Maintenance</option>
                <option value="RETIRED">Retired</option>
                <option value="MISSING">Missing</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-1">
                Condition
              </label>
              <select
                id="condition"
                value={filters.condition}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="NEEDS_REPAIR">Needs Repair</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={filters.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter location"
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Manufacturer Filter */}
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-300 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                id="manufacturer"
                value={filters.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                placeholder="Enter manufacturer"
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Client Filter */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-300 mb-1">
                Client
              </label>
              <select
                id="client"
                value={filters.client}
                onChange={(e) => handleChange('client', e.target.value)}
                disabled={loadingClients}
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.code})
                  </option>
                ))}
              </select>
              {loadingClients && (
                <div className="text-xs text-white/50 hover:text-white/80 transition-colors mt-1">
                  Loading clients...
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.minPrice}
                  onChange={(e) => handleChange('minPrice', e.target.value)}
                  placeholder="Min $"
                  className="w-full min-w-0 border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600 dark:text-brand-secondary-text text-sm flex-shrink-0">to</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxPrice}
                  onChange={(e) => handleChange('maxPrice', e.target.value)}
                  placeholder="Max $"
                  className="w-full min-w-0 border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Purchase Date Range
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="flex-1 border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-600 dark:text-brand-secondary-text text-sm px-1 flex-shrink-0">to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="flex-1 border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-600">
            <button
              onClick={onReset}
              className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover bg-gray-900 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={onApply}
              className="bg-blue-600 hover text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}