'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/cart-context'
import QRScanner from '@/components/barcode/qr-scanner'
import CartConfirmationModal from './cart-confirmation-modal'

interface CartScannerProps {
  onAssetScanned?: (asset: any, action: 'CHECK_IN' | 'CHECK_OUT') => void
  className?: string
}

export default function CartScanner({ onAssetScanned, className = "" }: CartScannerProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_OUT')
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const { addItem, canAddItem, processCart, getItemCount } = useCart()

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
        
        // Determine appropriate action based on asset status
        let suggestedAction: 'CHECK_IN' | 'CHECK_OUT'
        if (asset.status === 'AVAILABLE') {
          suggestedAction = 'CHECK_OUT'
        } else if (asset.status === 'CHECKED_OUT') {
          suggestedAction = 'CHECK_IN'
        } else {
          setError(`Asset is ${asset.status.toLowerCase().replace('_', ' ')} and cannot be processed`)
          return
        }

        // Use mode override or suggested action
        const finalAction = (mode === 'CHECK_OUT' && asset.status === 'AVAILABLE') || (mode === 'CHECK_IN' && asset.status === 'CHECKED_OUT') 
          ? mode 
          : suggestedAction

        // Validate and add to cart
        const validation = canAddItem(asset, finalAction)
        if (!validation.canAdd) {
          setError(validation.reason || 'Cannot add this asset to cart')
          return
        }

        const success = addItem(asset, finalAction)
        if (success) {
          setSuccess(`✅ ${asset.name} added to ${finalAction.toLowerCase().replace('_', ' ')} cart`)
          setSearchValue('')
          
          if (onAssetScanned) {
            onAssetScanned(asset, finalAction)
          }
          
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
      setShowConfirmation(false)
      setSuccess(`✅ Successfully processed ${getItemCount()} transaction${getItemCount() !== 1 ? 's' : ''}!`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    }
    
    return result
  }

  return (
    <div className={`relative ${className}`}>
      <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-brand-primary-text">Quick Scan to Cart</h3>
          
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-white/5 rounded-md p-1">
            <button
              onClick={() => setMode('CHECK_OUT')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                mode === 'CHECK_OUT'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📤 Check Out
            </button>
            <button
              onClick={() => setMode('CHECK_IN')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                mode === 'CHECK_IN'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📥 Check In
            </button>
          </div>
        </div>

        <form onSubmit={handleManualSearch} className="flex">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Scan or enter barcode, QR code, serial number..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className={`px-6 py-3 rounded-r-md text-sm font-medium transition-colors ${
              mode === 'CHECK_OUT'
                ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
            }`}
          >
            {searching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              `Add to ${mode.replace('_', ' ')}`
            )}
          </button>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </p>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-700 dark:text-brand-secondary-text">
          <p>💡 Tip: The system will automatically suggest check-in for checked-out items and check-out for available items.</p>
        </div>

        {/* Process Cart Button */}
        {getItemCount() > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-800 dark:text-gray-400">
                <span className="font-medium">{getItemCount()}</span> item{getItemCount() !== 1 ? 's' : ''} in cart
              </div>
              <button
                onClick={() => setShowConfirmation(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Process Cart
              </button>
            </div>
          </div>
        )}
      </div>

      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  )
}