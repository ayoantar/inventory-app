'use client'

import { useState } from 'react'
import { AssetStatus } from '../../../generated/prisma'

interface BulkActionsToolbarProps {
  selectedCount: number
  onBulkAction: (action: string, data?: any) => void
  onCancel: () => void
}

export default function BulkActionsToolbar({ 
  selectedCount, 
  onBulkAction, 
  onCancel 
}: BulkActionsToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available', color: 'text-emerald-600' },
    { value: 'CHECKED_OUT', label: 'Checked Out', color: 'text-amber-600' },
    { value: 'IN_MAINTENANCE', label: 'In Maintenance', color: 'text-red-600' },
    { value: 'RETIRED', label: 'Retired', color: 'text-white/50 hover:text-white/80 transition-colors' },
    { value: 'MISSING', label: 'Missing', color: 'text-red-600' },
    { value: 'RESERVED', label: 'Reserved', color: 'text-blue-600' }
  ]

  const handleStatusChange = (status: AssetStatus) => {
    onBulkAction('changeStatus', { status })
    setShowStatusMenu(false)
  }

  const handleDelete = () => {
    onBulkAction('delete')
    setShowDeleteConfirm(false)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 px-4 py-3">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {selectedCount} asset{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center space-x-2">
            {/* Change Status */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Status
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStatusMenu && (
                <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg border border-gray-300 dark:border-gray-600 rounded-md py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value as AssetStatus)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className={`font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Selected */}
            <button
              onClick={() => onBulkAction('export')}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {selectedCount} selected
          </span>
          <button
            onClick={onCancel}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Mobile Action Grid */}
        <div className="grid grid-cols-1 gap-2">
          {/* Change Status - Mobile */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="w-full flex items-center justify-center px-4 py-3 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-lg text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95 touch-manipulation transition-all"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Change Status
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusMenu && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg border border-gray-300 dark:border-gray-600 rounded-lg py-1 max-h-60 overflow-y-auto">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value as AssetStatus)}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 touch-manipulation"
                  >
                    <span className={`font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Export Selected - Mobile */}
            <button
              onClick={() => onBulkAction('export')}
              className="flex items-center justify-center px-4 py-3 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-lg text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95 touch-manipulation transition-all"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            {/* Delete - Mobile */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center px-4 py-3 border border-red-300 dark:border-red-600 text-sm font-medium rounded-lg text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 touch-manipulation transition-all"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-brand-dark-blue/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">
                  Delete Selected Assets
                </h3>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text mt-1">
                  Are you sure you want to delete {selectedCount} asset{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 touch-manipulation transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-lg active:scale-95 touch-manipulation transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}