'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import { useCart } from '@/contexts/cart-context'
import QRScanner from '@/components/barcode/qr-scanner'
import CartConfirmationModal from '@/components/cart/cart-confirmation-modal'
import PresetDetectionPanel from '@/components/presets/preset-detection-panel'
import SubstitutionModal from '@/components/presets/substitution-modal'
import { formatCategory } from '@/lib/utils'

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { state, removeItem, clearCart, processCart, addItem, canAddItem, getCheckInItems, getCheckOutItems } = useCart()
  
  const [searchValue, setSearchValue] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanMode, setScanMode] = useState<'CHECK_OUT' | 'CHECK_IN'>('CHECK_OUT')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [detectingPresets, setDetectingPresets] = useState(false)
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false)
  const [substitutionData, setSubstitutionData] = useState<{
    presetId: string
    presetName: string
    substitutions: any[]
  } | null>(null)

  // Helper function to get asset display name
  const getAssetDisplayName = (asset: any) => {
    // Try description first (this contains the actual asset name)
    if (asset.description && asset.description.trim() !== '') {
      return asset.description
    }
    
    // Try manufacturer + model combination
    const manufacturerModel = `${asset.manufacturer || ''} ${asset.model || ''}`.trim()
    if (manufacturerModel && manufacturerModel !== 'null' && manufacturerModel !== 'Generic') {
      return manufacturerModel
    }
    
    // Try name (which appears to be the item number)
    if (asset.name && asset.name.trim() !== '') {
      return asset.name
    }
    
    // Final fallback
    return `Asset ${asset.id}`
  }

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

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
          setSuccess(`✅ ${getAssetDisplayName(asset)} added to ${scanMode.toLowerCase().replace('_', ' ')} queue`)
          setSearchValue('')
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(''), 3000)
          
          // Trigger preset detection after a short delay
          setTimeout(() => {
            setDetectingPresets(true)
            setTimeout(() => setDetectingPresets(false), 1500)
          }, 500)
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
      router.push('/assets')
      // Show success message - you could also use a toast notification here
      setTimeout(() => {
        alert(`✅ Successfully processed ${state.items.length} transaction${state.items.length !== 1 ? 's' : ''}!`)
      }, 100)
    }
    
    return result
  }

  const handlePresetSelect = async (presetId: string) => {
    try {
      // Fetch preset details to get missing items
      const response = await fetch(`/api/presets/${presetId}`)
      if (response.ok) {
        const preset = await response.json()
        
        // Find items that aren't already in the cart
        const currentAssetIds = state.items.map(item => item.assetId)
        const missingItems = preset.items.filter((item: any) => 
          item.assetId && !currentAssetIds.includes(item.assetId)
        )
        
        if (missingItems.length > 0) {
          const confirmMessage = `Add ${missingItems.length} missing items from "${preset.name}" preset?`
          if (confirm(confirmMessage)) {
            await addPresetItems(missingItems)
          }
        } else {
          setSuccess(`✅ All items from "${preset.name}" preset are already in your cart!`)
          setTimeout(() => setSuccess(''), 3000)
        }
      }
    } catch (error) {
      console.error('Failed to load preset:', error)
      setError('Failed to load preset details')
    }
  }

  const handleAddMissingItems = async (presetId: string, missingItems: any[]) => {
    try {
      const response = await fetch(`/api/presets/${presetId}`)
      if (response.ok) {
        const preset = await response.json()
        
        // Find the full item details for missing items
        const itemsToAdd = preset.items.filter((item: any) => 
          missingItems.some(missing => missing.id === item.id)
        )
        
        if (itemsToAdd.length > 0) {
          await addPresetItems(itemsToAdd)
        }
      }
    } catch (error) {
      console.error('Failed to add missing items:', error)
      setError('Failed to add missing items')
    }
  }

  const addPresetItems = async (items: any[]) => {
    let addedCount = 0
    let failedCount = 0
    
    for (const item of items) {
      if (item.assetId) {
        // Add specific asset
        const success = addItem(item.asset, scanMode)
        if (success) {
          addedCount++
        } else {
          failedCount++
        }
      }
      // Note: For category-based items, we'd need additional logic
      // to find available assets in that category
    }
    
    if (addedCount > 0) {
      setSuccess(`✅ Added ${addedCount} item${addedCount !== 1 ? 's' : ''} from preset!`)
      setTimeout(() => setSuccess(''), 3000)
    }
    
    if (failedCount > 0) {
      setError(`⚠️ Failed to add ${failedCount} item${failedCount !== 1 ? 's' : ''} (already in cart or unavailable)`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleOpenSubstitutions = (presetId: string, presetName: string, substitutions: any[]) => {
    setSubstitutionData({ presetId, presetName, substitutions })
    setShowSubstitutionModal(true)
  }

  const handleSubstitutionConfirm = async (selections: Record<string, string>) => {
    if (!substitutionData) return

    try {
      let addedCount = 0
      
      // Process each substitution selection
      for (const [itemId, substituteAssetId] of Object.entries(selections)) {
        if (substituteAssetId) {
          // Fetch the substitute asset details
          const response = await fetch(`/api/assets/${substituteAssetId}`)
          if (response.ok) {
            const asset = await response.json()
            const success = addItem(asset, scanMode)
            if (success) {
              addedCount++
            }
          }
        }
      }

      if (addedCount > 0) {
        setSuccess(`✅ Added ${addedCount} substitute item${addedCount !== 1 ? 's' : ''} from "${substitutionData.presetName}" preset!`)
        setTimeout(() => setSuccess(''), 3000)
      }

      setSubstitutionData(null)
    } catch (error) {
      console.error('Failed to add substitutions:', error)
      setError('Failed to add substitute items')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark-blue via-gray-925 to-brand-black">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const checkInItems = getCheckInItems()
  const checkOutItems = getCheckOutItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark-blue via-gray-925 to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-3 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
        {/* Mobile-optimized Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Mobile: Stack vertically */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v0a2 2 0 002 2h8.5m-10.5-2v-2a2 2 0 012-2h8.5" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-brand-secondary-text bg-clip-text text-transparent">
                  Transaction Cart
                </h1>
              </div>
              <p className="text-xs sm:text-sm lg:text-base text-brand-secondary-text ml-9 sm:ml-11 hidden sm:block">
                Streamline your asset management with bulk operations
              </p>
            </div>
            <Link
              href="/assets"
              className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900/5 border border-gray-600 rounded-lg text-gray-300 hover font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-4 h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        </div>

        {/* Mobile-first responsive grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Scanning Interface - Mobile optimized */}
          <div className="order-1 lg:order-1 lg:col-span-1">
            <div className="bg-gray-900/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-600/50 shadow-lg p-3 sm:p-5 lg:p-8 lg:sticky lg:top-6 transition-all duration-300">
              {/* Mode Toggle - Mobile optimized */}
              <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-brand-primary-text mb-3 sm:mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
                  Transaction Mode
                </h2>
                <div className="grid grid-cols-2 gap-2 bg-gray-900/5 rounded-xl p-1.5 border border-gray-600">
                  <button
                    onClick={() => setScanMode('CHECK_OUT')}
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 flex flex-col sm:flex-row items-center justify-center touch-manipulation ${
                      scanMode === 'CHECK_OUT'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transform scale-[1.02]'
                        : 'text-gray-300 hover:bg-gray-800 bg-gray-800'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-xs sm:text-sm">Check Out</span>
                  </button>
                  <button
                    onClick={() => setScanMode('CHECK_IN')}
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 flex flex-col sm:flex-row items-center justify-center touch-manipulation ${
                      scanMode === 'CHECK_IN'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 transform scale-[1.02]'
                        : 'text-gray-300 hover:bg-gray-800 bg-gray-800'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm">Check In</span>
                  </button>
                </div>
              </div>

              {/* Scanning Interface - Mobile optimized */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <h3 className="text-base font-semibold text-brand-primary-text">Add Items</h3>
                </div>

                <form onSubmit={handleManualSearch} className="space-y-3">
                  {/* Input Field - Mobile optimized */}
                  <div className="relative group">
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Scan or enter ID"
                      className="w-full pl-10 pr-10 py-3 sm:py-3.5 border-2 border-gray-600 rounded-xl bg-gray-900/5 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all duration-200 text-sm font-medium text-center touch-manipulation"
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScanner(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-300 rounded-lg transition-colors touch-manipulation"
                      title="Open camera scanner"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Submit Button - Mobile optimized */}
                  <button
                    type="submit"
                    disabled={searching || !searchValue.trim()}
                    className={`w-full px-4 py-3 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-md active:scale-95 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed text-sm touch-manipulation ${
                      scanMode === 'CHECK_OUT'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:shadow-orange-500/40'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25 hover:shadow-green-500/40'
                    }`}
                  >
                    {searching ? (
                      <>
                        <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add to {scanMode === 'CHECK_OUT' ? 'Checkout' : 'Checkin'} Queue
                      </>
                    )}
                  </button>
                  
                  {/* Helper Text */}
                  <div className="text-center">
                    <p className="text-xs text-brand-secondary-text leading-relaxed">
                      Scan with camera or manually enter asset identifiers
                    </p>
                  </div>
                </form>

                {/* Status Messages */}
                {error && (
                  <div className="p-4 bg-gradient-to-r bg-red-900/20 border border-red-600/50 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-red-400 flex items-center font-medium">
                      <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-900/20 border border-green-600/50 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-green-400 flex items-center font-medium">
                      <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {success}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items List - Mobile optimized */}
          <div className="order-2 lg:order-2 lg:col-span-2">
            {/* Preset Detection Panel */}
            <PresetDetectionPanel 
              onPresetSelect={handlePresetSelect}
              onAddMissingItems={handleAddMissingItems}
              onOpenSubstitutions={handleOpenSubstitutions}
              isDetecting={detectingPresets}
            />
            
            <div className="bg-gray-900/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-600/50 shadow-lg">
              {/* Header - Mobile optimized */}
              <div className="p-3 sm:p-5 lg:p-8 border-b border-gray-600/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <h2 className="text-base sm:text-lg font-bold text-brand-primary-text">
                        Cart Items ({state.items.length})
                      </h2>
                    </div>
                    <div className="text-sm text-brand-primary-text ml-5 flex flex-wrap gap-2">
                      {checkOutItems.length > 0 && (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-orange-900/30 text-orange-400">
                          {checkOutItems.length} to check out
                        </span>
                      )}
                      {checkInItems.length > 0 && (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                          {checkInItems.length} to check in
                        </span>
                      )}
                    </div>
                  </div>
                  {state.items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-red-400 hover:bg-gray-800 bg-gray-800 rounded-xl transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95 border border-red-600/50 touch-manipulation"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Items List - Mobile optimized */}
              <div className="p-3 sm:p-5 lg:p-8">
                {state.items.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-brand-secondary-text bg-clip-text text-transparent mb-3">Ready to scan</h3>
                    <p className="text-brand-primary-text max-w-sm mx-auto leading-relaxed">
                      Use the scanner or enter asset codes to start building your cart
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Check-Out Items */}
                    {checkOutItems.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-orange-400">
                            Check Out Queue ({checkOutItems.length})
                          </h3>
                        </div>
                        <div className="bg-orange-900/20 rounded-xl border border-orange-600/50 overflow-hidden">
                          {checkOutItems.map((item, index) => (
                            <div key={item.assetId} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover transition-all duration-200 space-y-3 sm:space-y-0 ${index !== checkOutItems.length - 1 ? 'border-b border-orange-600/30' : ''}`}>
                              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                {/* Asset Image/Icon */}
                                <div className="flex-shrink-0">
                                  {item.asset.imageUrl ? (
                                    <img
                                      src={item.asset.imageUrl}
                                      alt={getAssetDisplayName(item.asset)}
                                      className="w-12 h-12 object-cover rounded-lg border border-orange-600/50"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-lg flex items-center justify-center border border-orange-600/50">
                                      <span className="text-lg">📦</span>
                                    </div>
                                  )}
                                </div>

                                {/* Asset Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="mb-2">
                                    <h4 className="font-semibold text-brand-primary-text text-base mb-1">
                                      {item.asset.name}
                                    </h4>
                                    {item.asset.description && (
                                      <p className="text-xs text-gray-400 overflow-hidden leading-relaxed" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                      }}>
                                        {item.asset.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-brand-primary-text">
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {formatCategory(item.asset.category)}
                                    </span>
                                    {item.asset.serialNumber && (
                                      <span className="flex items-center truncate">
                                        <svg className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        S/N: {item.asset.serialNumber}
                                      </span>
                                    )}
                                    {item.asset.location && (
                                      <span className="flex items-center truncate">
                                        <svg className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {item.asset.location}
                                      </span>
                                    )}
                                    {(item.asset.currentValue || item.asset.purchasePrice) && (
                                      <span className="flex items-center font-medium text-orange-400 col-span-2">
                                        <svg className="w-3 h-3 mr-1 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Value: ${(item.asset.currentValue || item.asset.purchasePrice)?.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0 w-full sm:w-auto">
                                  <span className="text-xs font-medium text-orange-400 bg-orange-900/30 px-2 py-1 rounded-full">
                                    Checking Out
                                  </span>
                                  <button
                                    onClick={() => removeItem(item.assetId)}
                                    className="text-red-400 hover p-2 rounded-lg hover transition-all duration-200 transform hover:scale-110 active:scale-95 touch-manipulation"
                                    title="Remove from cart"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Check-In Items */}
                    {checkInItems.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-green-400">
                            Check In Queue ({checkInItems.length})
                          </h3>
                        </div>
                        <div className="bg-green-900/20 rounded-xl border border-green-600/50 overflow-hidden">
                          {checkInItems.map((item, index) => (
                            <div key={item.assetId} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover transition-all duration-200 space-y-3 sm:space-y-0 ${index !== checkInItems.length - 1 ? 'border-b border-green-600/30' : ''}`}>
                              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                {/* Asset Image/Icon */}
                                <div className="flex-shrink-0">
                                  {item.asset.imageUrl ? (
                                    <img
                                      src={item.asset.imageUrl}
                                      alt={getAssetDisplayName(item.asset)}
                                      className="w-12 h-12 object-cover rounded-lg border border-green-600/50"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg flex items-center justify-center border border-green-600/50">
                                      <span className="text-lg">📦</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Asset Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="mb-2">
                                    <h4 className="font-semibold text-brand-primary-text text-base mb-1">
                                      {item.asset.name}
                                    </h4>
                                    {item.asset.description && (
                                      <p className="text-xs text-gray-400 overflow-hidden leading-relaxed" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                      }}>
                                        {item.asset.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-brand-primary-text">
                                    <span className="flex items-center">
                                      <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {formatCategory(item.asset.category)}
                                    </span>
                                    {item.asset.serialNumber && (
                                      <span className="flex items-center truncate">
                                        <svg className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        S/N: {item.asset.serialNumber}
                                      </span>
                                    )}
                                    {item.asset.location && (
                                      <span className="flex items-center truncate">
                                        <svg className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {item.asset.location}
                                      </span>
                                    )}
                                    {(item.asset.currentValue || item.asset.purchasePrice) && (
                                      <span className="flex items-center font-medium text-green-400 col-span-2">
                                        <svg className="w-3 h-3 mr-1 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        Value: ${(item.asset.currentValue || item.asset.purchasePrice)?.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0 w-full sm:w-auto">
                                  <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded-full">
                                    Checking In
                                  </span>
                                  <button
                                    onClick={() => removeItem(item.assetId)}
                                    className="text-red-400 hover p-2 rounded-lg hover transition-all duration-200 transform hover:scale-110 active:scale-95 touch-manipulation"
                                    title="Remove from cart"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {state.items.length > 0 && (
                <div className="p-4 sm:p-6 lg:p-8 border-t border-gray-600/50 bg-gradient-to-r from-gray-900/50 to-gray-800/30 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="text-sm text-brand-primary-text">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>
                          <span className="font-semibold text-brand-primary-text text-base sm:text-lg">{state.items.length}</span>
                          <span className="ml-1 text-sm sm:text-base">total items ready to process</span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowConfirmation(true)}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-95 text-sm sm:text-base touch-manipulation"
                    >
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Process All Transactions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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

      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={showSubstitutionModal}
        onClose={() => {
          setShowSubstitutionModal(false)
          setSubstitutionData(null)
        }}
        onConfirm={handleSubstitutionConfirm}
        availableSubstitutions={substitutionData?.substitutions || []}
        presetName={substitutionData?.presetName || ''}
      />
    </div>
  )
}