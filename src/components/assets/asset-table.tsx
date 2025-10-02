import Link from 'next/link'
import { Asset, AssetStatus, AssetCategory, AssetCondition } from '../../../generated/prisma'
import AssetPreviewModal from './asset-preview-modal'
import MobileAssetCard from './mobile-asset-card'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/contexts/cart-context'
import { formatStatus, getStatusBadgeColor, getCategoryIcon } from '@/lib/utils'

interface AssetTableProps {
  assets: (Asset & {
    client?: { name: string; code: string; isActive: boolean } | null
    createdBy: { name: string | null; email: string | null }
    lastModifiedBy: { name: string | null; email: string | null }
    _count: { transactions: number }
  })[]
  selectedAssets?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  bulkMode?: boolean
  onDuplicate?: (asset: Asset) => void
}


export default function AssetTable({ 
  assets, 
  selectedAssets = [], 
  onSelectionChange,
  onDuplicate,
  bulkMode = false 
}: AssetTableProps) {
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const { addItem, hasItem, canAddItem } = useCart()

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const tableRef = useRef<HTMLTableElement>(null)

  // Load saved column widths from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('assetTable-columnWidths')
    if (saved) {
      try {
        setColumnWidths(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to parse saved column widths')
      }
    }
  }, [])

  // Save column widths to localStorage
  useEffect(() => {
    if (Object.keys(columnWidths).length > 0) {
      localStorage.setItem('assetTable-columnWidths', JSON.stringify(columnWidths))
    }
  }, [columnWidths])

  const handleMouseDown = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault()
    setIsResizing(columnId)
    setStartX(e.clientX)
    
    const th = e.currentTarget.closest('th')
    if (th) {
      setStartWidth(th.offsetWidth)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const diff = e.clientX - startX
    const newWidth = Math.max(50, startWidth + diff) // Minimum width of 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }))
  }

  const handleMouseUp = () => {
    setIsResizing(null)
    setStartX(0)
    setStartWidth(0)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, startX, startWidth])

  const getColumnStyle = (columnId: string, defaultWidth?: string) => {
    const width = columnWidths[columnId]
    if (width) {
      return { width: `${width}px`, minWidth: `${width}px` }
    }
    // Set very small default width for actions column
    if (columnId === 'actions') {
      return { width: '60px', minWidth: '60px' }
    }
    return undefined
  }

  const handleAssetClick = (assetId: string) => {
    if (!bulkMode) {
      setPreviewAssetId(assetId)
      setShowPreview(true)
    }
  }

  const handleSelectAsset = (assetId: string) => {
    if (!onSelectionChange) return
    
    if (selectedAssets.includes(assetId)) {
      onSelectionChange(selectedAssets.filter(id => id !== assetId))
    } else {
      onSelectionChange([...selectedAssets, assetId])
    }
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    
    if (selectedAssets.length === assets.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(assets.map(asset => asset.id))
    }
  }

  const isAllSelected = assets.length > 0 && selectedAssets.length === assets.length
  const isPartialSelected = selectedAssets.length > 0 && selectedAssets.length < assets.length

  const handleAddToCart = (asset: Asset & { client?: { name: string; code: string; isActive: boolean } | null; createdBy: { name: string | null; email: string | null }; lastModifiedBy: { name: string | null; email: string | null }; _count: { transactions: number } }, action: 'CHECK_IN' | 'CHECK_OUT') => {
    const success = addItem(asset, action)
    if (!success) {
      const validation = canAddItem(asset, action)
      if (validation.reason) {
        alert(validation.reason)
      }
    }
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-3">
        {assets.map((asset) => (
          <MobileAssetCard
            key={asset.id}
            asset={asset}
            selected={selectedAssets.includes(asset.id)}
            onSelect={() => handleSelectAsset(asset.id)}
            bulkMode={bulkMode}
            onPreview={() => {
              setPreviewAssetId(asset.id)
              setShowPreview(true)
            }}
            onDuplicate={onDuplicate ? () => onDuplicate(asset) : undefined}
          />
        ))}
        {assets.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No assets found</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block bg-gray-900/5 shadow-sm rounded-lg border border-gray-600 overflow-hidden">
        <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full divide-y divide-gray-300 border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr className="divide-x divide-gray-300">
              {bulkMode && (
                <th className="px-3 py-3 text-center border-r border-gray-600 relative" style={getColumnStyle('checkbox')}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartialSelected
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                  />
                  <div 
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                    onMouseDown={(e) => handleMouseDown(e, 'checkbox')}
                  />
                </th>
              )}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-600 relative" style={getColumnStyle('asset')}>
                Asset
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                  onMouseDown={(e) => handleMouseDown(e, 'asset')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-600 relative" style={getColumnStyle('category')}>
                Category
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                  onMouseDown={(e) => handleMouseDown(e, 'category')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-600 relative" style={getColumnStyle('status')}>
                Status
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                  onMouseDown={(e) => handleMouseDown(e, 'status')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-600 relative" style={getColumnStyle('location')}>
                Location
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                  onMouseDown={(e) => handleMouseDown(e, 'location')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-600 relative" style={getColumnStyle('client')}>
                Client
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                  onMouseDown={(e) => handleMouseDown(e, 'client')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-600 relative" style={getColumnStyle('value')}>
                Value
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800"
                  onMouseDown={(e) => handleMouseDown(e, 'value')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider relative" style={getColumnStyle('actions')}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/5 divide-y divide-gray-300">
            {assets.map((asset) => (
              <tr key={asset.id} className={`hover transition-colors ${selectedAssets.includes(asset.id) ? 'bg-blue-50' : ''} ${asset.status === 'CHECKED_OUT' ? 'border-l-4 border-orange-500 bg-orange-100/40' : ''}`}>
                {bulkMode && (
                  <td className="px-3 py-3 whitespace-nowrap border-r border-gray-600 text-center" style={getColumnStyle('checkbox')}>
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => handleSelectAsset(asset.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                    />
                  </td>
                )}
                <td className="px-3 py-3 border-r border-gray-600" style={getColumnStyle('asset')}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-2 flex-shrink-0">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleAssetClick(asset.id)}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                          onClick={() => handleAssetClick(asset.id)}
                        >
                          <span className="text-sm">
                            {getCategoryIcon(asset.category)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 max-w-48">
                      <button
                        onClick={() => handleAssetClick(asset.id)}
                        className="text-left w-full"
                      >
                        <div className="text-sm font-medium text-brand-primary-text hover transition-colors break-words">
                          {asset.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-brand-secondary-text truncate">
                          {asset.serialNumber || 'No serial number'}
                        </div>
                        {asset.description && (
                          <div className="text-xs text-gray-600 dark:text-brand-secondary-text mt-0.5 leading-relaxed">
                            {asset.description}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-600 text-center" style={getColumnStyle('category')}>
                  <span className="text-sm text-brand-primary-text capitalize">
                    {asset.category.toLowerCase().replace('_', ' ')}
                  </span>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-600 text-center" style={getColumnStyle('status')}>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${getStatusBadgeColor(asset.status)}`}>
                    {formatStatus(asset.status)}
                  </span>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-600 text-center" style={getColumnStyle('location')}>
                  <div className="text-sm text-brand-primary-text">
                    {asset.location || '-'}
                  </div>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-600 text-center" style={getColumnStyle('client')}>
                  <div className="text-sm text-brand-primary-text">
                    {asset.client?.name ? (
                      <div className="font-medium">{asset.client.name}</div>
                    ) : (
                      <span className="text-brand-secondary-text">-</span>
                    )}
                  </div>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-600 text-center" style={getColumnStyle('value')}>
                  <div className="text-sm text-brand-primary-text">
                    {asset.currentValue 
                      ? `$${asset.currentValue.toLocaleString()}` 
                      : asset.purchasePrice 
                        ? `$${asset.purchasePrice.toLocaleString()}` 
                        : '-'
                    }
                  </div>
                </td>
                
                <td className="px-1 py-3 whitespace-nowrap text-center text-sm font-medium" style={getColumnStyle('actions')}>
                  <Link
                    href={`/assets/${asset.id}`}
                    className="px-2 py-1 text-brand-orange hover:text-brand-orange-soft dark:text-brand-orange dark:hover:text-brand-orange-soft bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded transition-colors font-medium text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      <AssetPreviewModal
        assetId={previewAssetId}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false)
          setPreviewAssetId(null)
        }}
      />
    </>
  )
}