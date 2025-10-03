import Link from 'next/link'
import { Asset, AssetStatus, AssetCategory, AssetCondition } from '../../../generated/prisma'
import { useState } from 'react'
import { useCart } from '@/contexts/cart-context'
import { formatStatus, getCategoryIcon } from '@/lib/utils'

interface MobileAssetCardProps {
  asset: Asset & {
    client?: { name: string; code: string; isActive: boolean } | null
    createdBy: { name: string | null; email: string | null }
    lastModifiedBy: { name: string | null; email: string | null }
    _count: { transactions: number }
  }
  selected?: boolean
  onSelect?: () => void
  bulkMode?: boolean
  onPreview?: () => void
  onDuplicate?: () => void
}

const statusColors = {
  AVAILABLE: 'bg-green-500/20 text-green-400',
  CHECKED_OUT: 'bg-red-500/20 text-red-400',
  IN_MAINTENANCE: 'bg-orange-500/20 text-orange-400',
  RETIRED: 'bg-gray-700/50 text-gray-300',
  MISSING: 'bg-red-500/20 text-red-400',
  RESERVED: 'bg-blue-500/20 text-blue-400'
}

const conditionColors = {
  EXCELLENT: 'text-green-400',
  GOOD: 'text-blue-400',
  FAIR: 'text-yellow-400',
  POOR: 'text-red-400',
  NEEDS_REPAIR: 'text-red-300'
}


export default function MobileAssetCard({
  asset,
  selected = false,
  onSelect,
  bulkMode = false,
  onPreview,
  onDuplicate
}: MobileAssetCardProps) {
  const [showActions, setShowActions] = useState(false)
  const { addItem, hasItem, canAddItem } = useCart()

  const handleAddToCart = (action: 'CHECK_IN' | 'CHECK_OUT') => {
    const success = addItem(asset, action)
    if (!success) {
      const validation = canAddItem(asset, action)
      if (validation.reason) {
        alert(validation.reason)
      }
    }
    setShowActions(false)
  }

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-700 p-4 space-y-3">
      {/* Header with checkbox and status */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {bulkMode && onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          <div className="flex-1">
            <Link
              href={`/assets/${asset.id}`}
              className="text-sm font-semibold text-brand-primary-text hover:text-blue-400"
            >
              {asset.name}
            </Link>
            {asset.assetNumber && (
              <div className="text-xs text-gray-400 mt-0.5">
                #{asset.assetNumber}
              </div>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[asset.status]}`}>
          {formatStatus(asset.status)}
        </span>
      </div>

      {/* Asset Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Category:</span>
          <span className="ml-1 text-brand-primary-text">
            {getCategoryIcon(asset.category)} {asset.category?.name || 'No Category'}
          </span>
        </div>
        {asset.brand && (
          <div>
            <span className="text-gray-400">Brand:</span>
            <span className="ml-1 text-brand-primary-text">{asset.brand}</span>
          </div>
        )}
        {asset.model && (
          <div>
            <span className="text-gray-400">Model:</span>
            <span className="ml-1 text-brand-primary-text">{asset.model}</span>
          </div>
        )}
        {asset.serialNumber && (
          <div className="col-span-2">
            <span className="text-gray-400">Serial:</span>
            <span className="ml-1 text-brand-primary-text font-mono text-xs">{asset.serialNumber}</span>
          </div>
        )}
        {asset.client && (
          <div className="col-span-2">
            <span className="text-gray-400">Client:</span>
            <span className="ml-1 text-brand-primary-text">{asset.client.name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          {asset.status === 'AVAILABLE' && (
            <button
              onClick={() => handleAddToCart('CHECK_OUT')}
              disabled={hasItem(asset.id)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {hasItem(asset.id) ? 'In Cart' : 'Check Out'}
            </button>
          )}
          {asset.status === 'CHECKED_OUT' && (
            <button
              onClick={() => handleAddToCart('CHECK_IN')}
              disabled={hasItem(asset.id)}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {hasItem(asset.id) ? 'In Cart' : 'Check In'}
            </button>
          )}
          {onPreview && (
            <button
              onClick={onPreview}
              className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
            >
              Preview
            </button>
          )}
        </div>

        {/* More actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 text-gray-400 hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showActions && (
            <div className="absolute right-0 bottom-full mb-1 w-40 bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <Link
                  href={`/assets/${asset.id}`}
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  onClick={() => setShowActions(false)}
                >
                  View Details
                </Link>
                {onDuplicate && (
                  <button
                    onClick={() => {
                      onDuplicate()
                      setShowActions(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Duplicate
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}