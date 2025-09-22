import Link from 'next/link'
import { Asset, AssetStatus, AssetCategory, AssetCondition } from '../../../generated/prisma'
import AssetPreviewModal from './asset-preview-modal'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/contexts/cart-context'

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

const statusColors = {
  AVAILABLE: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700',
  CHECKED_OUT: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  IN_MAINTENANCE: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
  RETIRED: 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-brand-secondary-text border-gray-300 dark:border-brand-dark-blue-deep',
  MISSING: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
  RESERVED: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700'
}


const categoryIcons = {
  CAMERA: '📷',
  LENS: '🔍',
  LIGHTING: '💡',
  AUDIO: '🎵',
  COMPUTER: '💻',
  STORAGE: '💾',
  ACCESSORY: '🔧',
  FURNITURE: '🪑',
  SOFTWARE: '💿',
  INFORMATION_TECHNOLOGY: '🖥️',
  OTHER: '📦'
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
    <div className="bg-gray-50 dark:bg-white/5 shadow-sm rounded-lg border border-gray-300 dark:border-brand-dark-blue-deep overflow-hidden">
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full divide-y divide-gray-300 dark:divide-brand-dark-blue-deep border-collapse">
          <thead className="bg-gray-100 dark:bg-brand-dark-blue">
            <tr className="divide-x divide-gray-300 dark:divide-brand-dark-blue-deep">
              {bulkMode && (
                <th className="px-3 py-3 text-center border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('checkbox')}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartialSelected
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div 
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                    onMouseDown={(e) => handleMouseDown(e, 'checkbox')}
                  />
                </th>
              )}
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('asset')}>
                Asset
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'asset')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('category')}>
                Category
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'category')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('status')}>
                Status
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'status')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('condition')}>
                Condition
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'condition')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('location')}>
                Location
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'location')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('client')}>
                Client
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'client')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep relative" style={getColumnStyle('value')}>
                Value
                <div 
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50"
                  onMouseDown={(e) => handleMouseDown(e, 'value')}
                />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider relative" style={getColumnStyle('actions')}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 dark:bg-white/5 divide-y divide-gray-300 dark:divide-brand-dark-blue-deep">
            {assets.map((asset) => (
              <tr key={asset.id} className={`hover:bg-white/10/50 dark:hover:bg-brand-dark-blue-deep/50 transition-colors ${selectedAssets.includes(asset.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${asset.status === 'CHECKED_OUT' ? 'border-l-4 border-orange-500 bg-orange-100/40 dark:bg-orange-900/10' : ''}`}>
                {bulkMode && (
                  <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('checkbox')}>
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => handleSelectAsset(asset.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                <td className="px-3 py-3 border-r border-gray-300 dark:border-brand-dark-blue-deep" style={getColumnStyle('asset')}>
                  <div className="flex items-center">
                    <div className="w-10 h-10 mr-2 flex-shrink-0">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-brand-dark-blue-deep cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleAssetClick(asset.id)}
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
                          onClick={() => handleAssetClick(asset.id)}
                        >
                          <span className="text-sm">
                            {categoryIcons[asset.category as AssetCategory] || '📦'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 max-w-48">
                      <button
                        onClick={() => handleAssetClick(asset.id)}
                        className="text-left w-full"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words">
                          {asset.name}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-brand-secondary-text truncate">
                          {asset.serialNumber || 'No serial number'}
                        </div>
                        {asset.description && (
                          <div className="text-xs text-gray-800 dark:text-brand-secondary-text mt-0.5 leading-relaxed">
                            {asset.description}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('category')}>
                  <span className="text-sm text-gray-900 dark:text-brand-primary-text capitalize">
                    {asset.category.toLowerCase().replace('_', ' ')}
                  </span>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('status')}>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${statusColors[asset.status as AssetStatus]}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('condition')}>
                  <span className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                    {asset.condition.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('location')}>
                  <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                    {asset.location || '-'}
                  </div>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('client')}>
                  <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                    {asset.client?.name ? (
                      <div className="font-medium">{asset.client.name}</div>
                    ) : (
                      <span className="text-gray-400 dark:text-brand-secondary-text">No Client</span>
                    )}
                  </div>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap border-r border-gray-300 dark:border-brand-dark-blue-deep text-center" style={getColumnStyle('value')}>
                  <div className="text-sm text-gray-900 dark:text-brand-primary-text">
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
                    className="px-1 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors font-medium text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {assets.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-brand-primary-text">No assets found</h3>
          <p className="mt-1 text-sm text-gray-700 dark:text-brand-secondary-text">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}

      <AssetPreviewModal
        assetId={previewAssetId}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false)
          setPreviewAssetId(null)
        }}
      />
    </div>
  )
}