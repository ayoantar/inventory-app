'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { useSession } from 'next-auth/react'
import QRScanner from '@/components/barcode/qr-scanner'
import CartConfirmationModal from './cart-confirmation-modal'

interface ScanToCartSidebarProps {
  isOpen: boolean
  onClose: () => void
}


export default function ScanToCartSidebar({ isOpen, onClose }: ScanToCartSidebarProps) {
  const { state, removeItem, updateItem, clearCart, processCart, addItem, canAddItem } = useCart()
  const { data: session } = useSession()

  // Helper function to get asset display name
  const getAssetDisplayName = (asset: any) => {
    // Use the asset name as primary display (this is now the correct field after our data fix)
    if (asset.name && asset.name.trim() !== '') {
      return asset.name
    }
    
    // Fallback to manufacturer + model combination
    const manufacturerModel = `${asset.manufacturer || ''} ${asset.model || ''}`.trim()
    if (manufacturerModel && manufacturerModel !== 'null' && manufacturerModel !== 'Generic') {
      return manufacturerModel
    }
    
    // Try other possible name fields
    if (asset.title && asset.title.trim() !== '') {
      return asset.title
    }
    
    if (asset.assetName && asset.assetName.trim() !== '') {
      return asset.assetName
    }
    
    if (asset.itemName && asset.itemName.trim() !== '') {
      return asset.itemName
    }
    
    // Final fallback
    return `Asset ${asset.id}`
  }
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanMode, setScanMode] = useState<'CHECK_OUT' | 'CHECK_IN'>('CHECK_OUT')


  const searchAndAddAsset = async (query: string) => {
    if (!query.trim()) return

    setSearching(true)
    setError('')
    setSuccess('')

    try {
      // Search for asset by barcode, QR code, serial number, or asset ID
      const response = await fetch(`/api/assets/search?q=${encodeURIComponent(query.trim())}`)
      
      if (response.ok) {
        const results = await response.json()
        
        if (results.length === 0) {
          setError('No asset found with this code')
          return
        }

        const asset = results[0] // Take the first match
        
        
        // Use the current scan mode, but validate it makes sense
        if (scanMode === 'CHECK_OUT' && asset.status !== 'AVAILABLE') {
          setError(`Cannot check out ${getAssetDisplayName(asset)} - currently ${asset.status.toLowerCase().replace('_', ' ')}`)
          return
        }
        
        if (scanMode === 'CHECK_IN' && asset.status !== 'CHECKED_OUT') {
          setError(`Cannot check in ${getAssetDisplayName(asset)} - currently ${asset.status.toLowerCase().replace('_', ' ')}`)
          return
        }

        // Validate and add to cart
        const validation = canAddItem(asset, scanMode)
        if (!validation.canAdd) {
          setError(validation.reason || 'Cannot add this asset to cart')
          return
        }

        const success = addItem(asset, scanMode)
        if (success) {
          setSuccess(`✅ ${getAssetDisplayName(asset)} added to cart`)
          setSearchValue('')
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000)
        } else {
          setError('Failed to add asset to cart')
        }
      } else {
        setError('Failed to search for asset')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('An error occurred while searching')
    } finally {
      setSearching(false)
    }
  }

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchAndAddAsset(searchValue)
  }

  const handleScanSuccess = (decodedText: string, format: string) => {
    console.log(`Scanned: ${decodedText} (${format})`)
    setShowScanner(false)
    setSearchValue(decodedText)
    searchAndAddAsset(decodedText)
  }

  const handleScanError = (error: string) => {
    console.error('Scan error:', error)
    setError('Camera scanning error. Please try manual entry.')
  }

  const handleProcessConfirm = async () => {
    const result = await processCart()
    
    if (result.success && result.errors.length === 0) {
      // All successful - close both modals
      setShowConfirmation(false)
      onClose()
      
      // Show success message
      alert(`✅ Successfully processed ${state.items.length} transaction${state.items.length !== 1 ? 's' : ''}!`)
    }
    
    return result
  }




  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-50 dark:bg-white/5 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">
                Scan to Cart
              </h2>
              <p className="text-sm text-gray-700 dark:text-brand-secondary-text">
                Scan items to build your transaction cart
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setScanMode('CHECK_OUT')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                scanMode === 'CHECK_OUT'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Check Out Mode
            </button>
            <button
              onClick={() => setScanMode('CHECK_IN')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                scanMode === 'CHECK_IN'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check In Mode
            </button>
          </div>
        </div>

        {/* Scanning Interface */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          <div className="space-y-4">
            {/* Manual Search/Input */}
            <form onSubmit={handleManualSearch} className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Scan or enter barcode, serial number..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
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
              
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-3 bg-gray-100 hover:bg-white/10 dark:bg-white/5 dark:hover:bg-white/10 border border-l-0 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                title="Open Camera Scanner"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button
                type="submit"
                disabled={searching || !searchValue.trim()}
                className={`px-6 py-3 text-white rounded-r-md text-sm font-medium transition-colors ${
                  scanMode === 'CHECK_OUT'
                    ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                    : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                }`}
              >
                {searching ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                  </svg>
                ) : (
                  scanMode === 'CHECK_OUT' ? 'Add to Check Out' : 'Add to Check In'
                )}
              </button>
            </form>

            {/* Status Messages */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scanned Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {state.items.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-brand-primary-text">Ready to scan</p>
              <p className="text-xs text-gray-700 dark:text-brand-secondary-text">Scan barcodes or enter asset details to start building your cart</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className={`text-sm font-medium mb-3 flex items-center ${
                scanMode === 'CHECK_OUT' 
                  ? 'text-orange-700 dark:text-orange-400' 
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {scanMode === 'CHECK_OUT' ? (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {scanMode === 'CHECK_OUT' ? 'Check Out' : 'Check In'} Queue ({state.items.length})
              </h3>
              
              {state.items.map((item) => (
                <div key={item.assetId} className={`rounded-md p-2 border ${
                  scanMode === 'CHECK_OUT'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {item.asset.imageUrl ? (
                        <img
                          src={item.asset.imageUrl}
                          alt={getAssetDisplayName(item.asset)}
                          className="w-6 h-6 object-cover rounded"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-100 dark:bg-white/5 rounded flex items-center justify-center">
                          <span className="text-xs">📦</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-brand-primary-text truncate">
                          {getAssetDisplayName(item.asset)}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-brand-secondary-text">
                          {item.asset.category.replace('_', ' ')} • {item.asset.serialNumber || item.asset.name || 'No S/N'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.assetId)}
                      className="ml-2 text-red-400 hover:text-red-600 p-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {state.items.length > 0 && (
          <div className="p-4 border-t border-gray-300 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-brand-secondary-text">Total items:</span>
              <span className="font-medium text-gray-900 dark:text-brand-primary-text">{state.items.length}</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
              >
                Clear All
              </button>
              
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={state.items.length === 0}
                className={`flex-1 px-4 py-2 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors flex items-center justify-center ${
                  scanMode === 'CHECK_OUT'
                    ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                    : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {scanMode === 'CHECK_OUT' ? 'Process Check Outs' : 'Process Check Ins'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />

      {/* Confirmation Modal */}
      <CartConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleProcessConfirm}
      />
    </>
  )
}