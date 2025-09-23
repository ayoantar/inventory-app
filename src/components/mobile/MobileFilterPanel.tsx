'use client'

import { useState } from 'react'

interface FilterOptions {
  categories: string[]
  statuses: string[]
  conditions: string[]
}

interface FilterValues {
  search: string
  category: string
  status: string
  condition: string
  priceRange: [number, number]
}

interface MobileFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  filterOptions: FilterOptions
  filterValues: FilterValues
  onFilterChange: (filters: FilterValues) => void
  onClearFilters: () => void
}

export default function MobileFilterPanel({
  isOpen,
  onClose,
  filterOptions,
  filterValues,
  onFilterChange,
  onClearFilters
}: MobileFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filterValues)
  const [expandedSections, setExpandedSections] = useState({
    category: false,
    status: false,
    condition: false,
    price: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleApplyFilters = () => {
    onFilterChange(localFilters)
    onClose()
  }

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      status: '',
      condition: '',
      priceRange: [0, 10000] as [number, number]
    }
    setLocalFilters(clearedFilters)
    onClearFilters()
    onClose()
  }

  const activeFiltersCount = [
    localFilters.category,
    localFilters.status,
    localFilters.condition,
    localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 10000
  ].filter(Boolean).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed inset-x-0 bottom-0 bg-gray-900 rounded-t-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">
                Filters
              </h2>
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-orange rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Assets
            </label>
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by name, description, or serial number..."
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>

          {/* Filter Sections */}
          <div className="flex-1 overflow-y-auto">
            {/* Category Filter */}
            <div className="border-b border-gray-700">
              <button
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between p-6 text-left hover transition-colors"
              >
                <span className="text-sm font-medium text-white">
                  Category
                  {localFilters.category && (
                    <span className="ml-2 text-xs text-brand-orange">({localFilters.category})</span>
                  )}
                </span>
                <svg
                  className={`w-5 h-5 text-white/50 hover:text-white/80 transition-colors transition-transform ${expandedSections.category ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.category && (
                <div className="px-6 pb-4 space-y-2">
                  <button
                    onClick={() => setLocalFilters(prev => ({ ...prev, category: '' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !localFilters.category
                        ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                        : 'text-gray-300 hover'
                    }`}
                  >
                    All Categories
                  </button>
                  {filterOptions.categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setLocalFilters(prev => ({ ...prev, category }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        localFilters.category === category
                          ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                          : 'text-gray-300 hover'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="border-b border-gray-700">
              <button
                onClick={() => toggleSection('status')}
                className="w-full flex items-center justify-between p-6 text-left hover transition-colors"
              >
                <span className="text-sm font-medium text-white">
                  Status
                  {localFilters.status && (
                    <span className="ml-2 text-xs text-brand-orange">({localFilters.status})</span>
                  )}
                </span>
                <svg
                  className={`w-5 h-5 text-white/50 hover:text-white/80 transition-colors transition-transform ${expandedSections.status ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.status && (
                <div className="px-6 pb-4 space-y-2">
                  <button
                    onClick={() => setLocalFilters(prev => ({ ...prev, status: '' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !localFilters.status
                        ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                        : 'text-gray-300 hover'
                    }`}
                  >
                    All Statuses
                  </button>
                  {filterOptions.statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setLocalFilters(prev => ({ ...prev, status }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        localFilters.status === status
                          ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                          : 'text-gray-300 hover'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Condition Filter */}
            <div className="border-b border-gray-700">
              <button
                onClick={() => toggleSection('condition')}
                className="w-full flex items-center justify-between p-6 text-left hover transition-colors"
              >
                <span className="text-sm font-medium text-white">
                  Condition
                  {localFilters.condition && (
                    <span className="ml-2 text-xs text-brand-orange">({localFilters.condition})</span>
                  )}
                </span>
                <svg
                  className={`w-5 h-5 text-white/50 hover:text-white/80 transition-colors transition-transform ${expandedSections.condition ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.condition && (
                <div className="px-6 pb-4 space-y-2">
                  <button
                    onClick={() => setLocalFilters(prev => ({ ...prev, condition: '' }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !localFilters.condition
                        ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                        : 'text-gray-300 hover'
                    }`}
                  >
                    All Conditions
                  </button>
                  {filterOptions.conditions.map((condition) => (
                    <button
                      key={condition}
                      onClick={() => setLocalFilters(prev => ({ ...prev, condition }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        localFilters.condition === condition
                          ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                          : 'text-gray-300 hover'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-700 bg-gray-100 dark:bg-gray-800">
            <div className="flex space-x-3">
              <button
                onClick={handleClearFilters}
                className="bg-gray-100 dark:bg-gray-800"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-brand-orange hover rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}