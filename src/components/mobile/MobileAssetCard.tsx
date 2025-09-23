'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Asset {
  id: string
  name: string
  description?: string | null
  category: string
  status: 'AVAILABLE' | 'CHECKED_OUT' | 'MAINTENANCE' | 'RETIRED'
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  serialNumber?: string | null
  purchasePrice?: number | null
  currentValue?: number | null
  imageUrl?: string | null
  qrCode?: string | null
  createdAt: Date
  updatedAt: Date
}

interface MobileAssetCardProps {
  asset: Asset
  onSelect?: (asset: Asset) => void
  onEdit?: (asset: Asset) => void
  onDelete?: (asset: Asset) => void
  selected?: boolean
}

export default function MobileAssetCard({
  asset,
  onSelect,
  onEdit,
  onDelete,
  selected = false
}: MobileAssetCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'CHECKED_OUT':
        return 'bg-blue-100 text-blue-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      case 'RETIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'text-green-600'
      case 'GOOD':
        return 'text-blue-600'
      case 'FAIR':
        return 'text-yellow-600'
      case 'POOR':
        return 'text-red-600'
      default:
        return 'text-white/50 hover:text-white/80 transition-colors'
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div
      className={`relative bg-gray-900/5 backdrop-blur-sm border rounded-2xl p-4 shadow-sm transition-all duration-200 touch-manipulation ${
        selected
          ? 'border-brand-orange bg-brand-orange/5'
          : 'border-gray-700 hover:border-gray-600:border-gray-600'
      }`}
      onClick={() => onSelect?.(asset)}
    >
      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start space-x-3 mb-3">
        {/* Image */}
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0 overflow-hidden">
          {asset.imageUrl && !imageError ? (
            <Image
              src={asset.imageUrl}
              alt={asset.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        {/* Asset Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">
            {asset.name}
          </h3>
          <p className="text-sm text-white/50 hover:text-white/80 transition-colors mt-1">
            {asset.category}
          </p>
          {asset.serialNumber && (
            <p className="text-xs text-white/50 hover:text-white/80 transition-colors mt-1 font-mono">
              S/N: {asset.serialNumber}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
            className="p-1 rounded-lg text-white/50 hover:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 w-36 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-20">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(asset)
                      setIsMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(asset)
                      setIsMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {asset.description && (
        <p className="text-sm text-white/50 hover:text-white/80 transition-colors mb-3 line-clamp-2">
          {asset.description}
        </p>
      )}

      {/* Status and Condition */}
      <div className="flex items-center space-x-2 mb-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
          {asset.status.replace('_', ' ')}
        </span>
        <span className={`text-xs font-medium ${getConditionColor(asset.condition)}`}>
          {asset.condition}
        </span>
      </div>

      {/* Price Information */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-white/50 hover:text-white/80 transition-colors">Purchase:</span>
          <span className="ml-1 font-medium text-white">
            {formatPrice(asset.purchasePrice)}
          </span>
        </div>
        <div>
          <span className="text-white/50 hover:text-white/80 transition-colors">Current:</span>
          <span className="ml-1 font-medium text-white">
            {formatPrice(asset.currentValue)}
          </span>
        </div>
      </div>

      {/* QR Code Indicator */}
      {asset.qrCode && (
        <div className="absolute bottom-3 right-3">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded border border-gray-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/50 hover:text-white/80 transition-colors" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}