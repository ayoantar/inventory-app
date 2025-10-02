'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Asset, AssetStatus, AssetCategory, AssetCondition } from '../../../generated/prisma'
import { formatStatus } from '@/lib/utils'

interface AssetWithRelations extends Asset {
  client?: { name: string; code: string; isActive: boolean } | null
  createdBy: { name: string | null; email: string | null }
  lastModifiedBy: { name: string | null; email: string | null }
  _count: { transactions: number }
}

interface AssetPreviewModalProps {
  assetId: string | null
  isOpen: boolean
  onClose: () => void
}

const statusColors = {
  AVAILABLE: 'bg-emerald-900/30 text-emerald-400 border-emerald-600',
  CHECKED_OUT: 'bg-red-900/30 text-red-400 border-red-600',
  IN_MAINTENANCE: 'bg-orange-900/30 text-orange-400 border-orange-600',
  RETIRED: 'bg-gray-800 text-gray-400 border-gray-600',
  MISSING: 'bg-red-900/30 text-red-400 border-red-600',
  RESERVED: 'bg-blue-900/30 text-blue-400 border-blue-600'
}

const conditionColors = {
  EXCELLENT: 'text-emerald-600',
  GOOD: 'text-blue-600',
  FAIR: 'text-amber-600',
  POOR: 'text-orange-600',
  NEEDS_REPAIR: 'text-red-600'
}

export default function AssetPreviewModal({ assetId, isOpen, onClose }: AssetPreviewModalProps) {
  const [asset, setAsset] = useState<AssetWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && assetId) {
      fetchAsset()
    }
  }, [isOpen, assetId])

  const fetchAsset = async () => {
    if (!assetId) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/assets/${assetId}`)
      if (response.ok) {
        const assetData = await response.json()
        setAsset(assetData)
      } else {
        setError('Failed to load asset details')
      }
    } catch (error) {
      setError('An error occurred while loading asset details')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-primary-text">Asset Preview</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-600 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {asset && !loading && (
            <div className="space-y-6">
              {/* Header with image */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-700"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-brand-primary-text">{asset.name}</h3>
                  <p className="text-brand-primary-text">{asset.manufacturer} {asset.model}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusColors[asset.status as AssetStatus]}`}>
                      {formatStatus(asset.status)}
                    </span>
                    <span className={`text-sm font-medium ${conditionColors[asset.condition as AssetCondition]}`}>
                      {asset.condition}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Category</dt>
                  <dd className="text-sm text-brand-primary-text capitalize">{asset.category.toLowerCase().replace('_', ' ')}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Client</dt>
                  <dd className="text-sm text-brand-primary-text">
                    {asset.client?.name || (
                      <span className="text-white/50 hover:text-white/80 transition-colors">No Client</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Location</dt>
                  <dd className="text-sm text-brand-primary-text">{asset.location || '-'}</dd>
                </div>
                {asset.serialNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Serial Number</dt>
                    <dd className="text-sm text-brand-primary-text font-mono">{asset.serialNumber}</dd>
                  </div>
                )}
                {asset.purchasePrice && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Purchase Price</dt>
                    <dd className="text-sm text-brand-primary-text">${asset.purchasePrice.toLocaleString()}</dd>
                  </div>
                )}
                {asset.currentValue && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Current Value</dt>
                    <dd className="text-sm text-brand-primary-text">${asset.currentValue.toLocaleString()}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text">Transactions</dt>
                  <dd className="text-sm text-brand-primary-text">{asset._count?.transactions || 0}</dd>
                </div>
              </div>

              {/* Description */}
              {asset.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">Description</dt>
                  <dd className="text-sm text-brand-primary-text">
                    <div className="space-y-1">
                      {asset.description.split('\n').map((line, index) => (
                        <div key={index}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </dd>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-700">
                <Link
                  href={`/assets/${asset.id}`}
                  className="flex-1 bg-blue-600 hover text-white px-4 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  onClick={onClose}
                >
                  View Full Details
                </Link>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}