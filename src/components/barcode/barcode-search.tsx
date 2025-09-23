'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRScanner from './qr-scanner'

interface BarcodeSearchProps {
  onAssetFound?: (assetId: string) => void
  placeholder?: string
  className?: string
}

export default function BarcodeSearch({ onAssetFound, placeholder = "Search by barcode or QR code...", className = "" }: BarcodeSearchProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const searchAsset = async (query: string) => {
    if (!query.trim()) return

    setSearching(true)
    setError('')

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
        
        if (onAssetFound) {
          onAssetFound(asset.id)
        } else {
          // Navigate to asset detail page
          router.push(`/assets/${asset.id}`)
        }
        
        setSearchValue('')
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
    searchAsset(searchValue)
  }

  const handleScanSuccess = (decodedText: string, format: string) => {
    console.log(`Scanned: ${decodedText} (${format})`)
    setShowScanner(false)
    setSearchValue(decodedText)
    searchAsset(decodedText)
  }

  const handleScanError = (error: string) => {
    console.error('Scan error:', error)
    setError('Camera scanning error. Please try manual entry.')
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleManualSearch} className="flex">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-l-md bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50 hover:text-white/80 transition-colors"
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
          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover border border-l-0 border-gray-600 text-gray-300 transition-colors"
          title="Scan QR Code or Barcode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </button>
        
        <button
          type="submit"
          disabled={searching || !searchValue.trim()}
          className="px-4 py-2 bg-blue-600 hover disabled:opacity-50 text-white rounded-r-md text-sm font-medium transition-colors"
        >
          {searching ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md z-10">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  )
}