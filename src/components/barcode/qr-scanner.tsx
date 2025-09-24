'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string, format: string) => void
  onScanError?: (error: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onScanError, isOpen, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Remove specific format restrictions to avoid "unsupported scan type" errors
          // The scanner will auto-detect supported formats
        }

        const scanner = new Html5QrcodeScanner('qr-scanner', config, false)
        
        scanner.render(
          (decodedText, decodedResult) => {
            console.log(`Code matched = ${decodedText}`, decodedResult)
            onScanSuccess(decodedText, decodedResult.result.format?.formatName || 'Unknown')
            handleStop()
          },
          (error) => {
            // Only log actual scanning errors, not camera permission issues
            if (error.includes('NotFoundException')) {
              // This is normal - just means no code was found in frame
              return
            }
            console.warn(`Code scan error = ${error}`)
            if (onScanError && !error.includes('Camera not ready')) {
              onScanError(error)
            }
          }
        )

        scannerRef.current = scanner
        setIsScanning(true)
      } catch (error) {
        console.error('Failed to initialize QR scanner:', error)
        if (onScanError) {
          onScanError('Failed to initialize scanner: ' + (error as Error).message)
        }
      }
    }

    return () => {
      handleStop()
    }
  }, [isOpen])

  const handleStop = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    handleStop()
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark-blue/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Scan QR Code or Barcode</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 active:scale-95 touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <div id="qr-scanner" className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-black"></div>
          </div>

          <div className="text-sm text-gray-600 dark:text-brand-secondary-text text-center space-y-1">
            <p>Position the QR code or barcode within the camera view to scan.</p>
            <p className="text-xs opacity-80">Supported formats: QR Code, Code 128, Code 39</p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}