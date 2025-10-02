'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCategory } from '@/lib/utils'

interface CheckedOutAsset {
  id: string
  name: string
  description?: string
  serialNumber?: string
  category: string
  location?: string
  currentValue?: number
  purchasePrice?: number
  imageUrl?: string
  transactions: {
    id: string
    type: string
    user: {
      name: string | null
      email: string | null
    }
    expectedReturnDate?: string
    createdAt: string
  }[]
}

interface CheckedOutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CheckedOutModal({ isOpen, onClose }: CheckedOutModalProps) {
  const [assets, setAssets] = useState<CheckedOutAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchCheckedOutAssets()
    }
  }, [isOpen])

  const fetchCheckedOutAssets = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/assets?status=CHECKED_OUT&includeTransactions=true')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      } else {
        setError('Failed to fetch checked out assets')
      }
    } catch (error) {
      setError('An error occurred while fetching assets')
    } finally {
      setLoading(false)
    }
  }

  const getOverdueDays = (expectedReturnDate: string) => {
    const expected = new Date(expectedReturnDate)
    const today = new Date()
    const diffTime = today.getTime() - expected.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const isOverdue = (expectedReturnDate?: string) => {
    if (!expectedReturnDate) return false
    return new Date(expectedReturnDate) < new Date()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/5 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-brand-primary-text">
                  Checked Out Assets
                </h2>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text mt-1">
                  {assets.length} asset{assets.length !== 1 ? 's' : ''} currently checked out
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && assets.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No checked out assets</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                  All assets are currently available or in other states
                </p>
              </div>
            )}

            {!loading && !error && assets.length > 0 && (
              <div className="space-y-3">
                {assets.map((asset) => {
                  const activeTransaction = asset.transactions.find(t => t.type === 'CHECK_OUT')
                  const overdue = activeTransaction?.expectedReturnDate ? isOverdue(activeTransaction.expectedReturnDate) : false
                  const overdueDays = activeTransaction?.expectedReturnDate ? getOverdueDays(activeTransaction.expectedReturnDate) : 0
                  
                  return (
                    <div key={asset.id} className={`bg-gray-900 rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                      overdue ? 'border-red-300 bg-red-50' : 'border-gray-700'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {/* Asset Image/Icon */}
                        <div className="flex-shrink-0">
                          {asset.imageUrl ? (
                            <img
                              src={asset.imageUrl}
                              alt={asset.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-900/5 rounded-lg flex items-center justify-center">
                              <span className="text-lg">📦</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Asset Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-brand-primary-text truncate">
                                {asset.name}
                              </h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-300 mt-1">
                                <span>{formatCategory(asset.category)}</span>
                                {asset.serialNumber && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{asset.serialNumber}</span>
                                  </>
                                )}
                                {(asset.currentValue || asset.purchasePrice) && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">${(asset.currentValue || asset.purchasePrice)?.toLocaleString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {overdue && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                                {overdueDays}d overdue
                              </span>
                            )}
                          </div>
                          
                          {/* Transaction Info - Compact */}
                          {activeTransaction && (
                            <div className="flex items-center justify-between text-xs text-gray-300 mt-2 pt-2 border-t border-gray-600">
                              <span>
                                Checked out by <span className="font-medium text-gray-300">{activeTransaction.user.name || activeTransaction.user.email}</span>
                              </span>
                              <div className="flex items-center space-x-4">
                                <span>
                                  {new Date(activeTransaction.createdAt).toLocaleDateString()}
                                </span>
                                {activeTransaction.expectedReturnDate && (
                                  <span className={overdue ? 'text-red-600 font-medium' : ''}>
                                    Due: {new Date(activeTransaction.expectedReturnDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex-shrink-0">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="p-2 text-white/50 hover:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 rounded transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 bg-gray-900/5/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/50 hover:text-white/80 transition-colors">
                {assets.filter(asset => {
                  const activeTransaction = asset.transactions.find(t => t.type === 'CHECK_OUT')
                  return activeTransaction?.expectedReturnDate ? isOverdue(activeTransaction.expectedReturnDate) : false
                }).length} overdue • {assets.length} total checked out
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/assets?status=CHECKED_OUT"
                  className="px-4 py-2 bg-blue-600 hover text-white rounded-md text-sm font-medium transition-colors"
                  onClick={onClose}
                >
                  View in Assets Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}