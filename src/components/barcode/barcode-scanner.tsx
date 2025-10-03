'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string, format: string) => void
  onScanError?: (error: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function BarcodeScanner({ onScanSuccess, onScanError, isOpen, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [cameraRequested, setCameraRequested] = useState(false)
  const scannerId = 'qr-scanner-container'

  useEffect(() => {
    if (isOpen && !cameraRequested && !showManualInput) {
      // Auto-start camera when modal opens
      console.log('QR Scanner opened, auto-starting camera')
      initializeCamera()
    } else if (!isOpen) {
      cleanupCamera()
      setCameraRequested(false)
    }

    return () => {
      cleanupCamera()
    }
  }, [isOpen, cameraRequested, showManualInput])

  const initializeCamera = async () => {
    try {
      console.log('🔍 Starting HTML5-QRCode scanner initialization...')
      console.log('🔧 Environment check:', {
        navigator: !!navigator,
        mediaDevices: !!navigator?.mediaDevices,
        getUserMedia: !!navigator?.mediaDevices?.getUserMedia,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      })

      setCameraError(null)
      setCameraRequested(true)

      // Wait for React to render the DOM elements
      await new Promise(resolve => setTimeout(resolve, 100))

      // Wait for DOM element to be ready with retry logic
      let container = null
      let retries = 0
      const maxRetries = 20

      while (!container && retries < maxRetries) {
        container = document.getElementById(scannerId)
        if (!container) {
          console.log(`🔄 Waiting for DOM element (attempt ${retries + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 200))
          retries++
        }
      }

      if (!container) {
        throw new Error('Scanner container not found in DOM after retries')
      }
      console.log('📦 Scanner container found:', container)

      // Create scanner instance
      scannerRef.current = new Html5Qrcode(scannerId)
      console.log('📷 Scanner instance created successfully')

      // Define success callback
      const handleScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log('✅ Barcode/QR detected:', decodedText)
        console.log('📊 Scan result:', decodedResult)

        // Add haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }

        // Stop scanner first
        stopScanner()

        // Call success callback and close
        onScanSuccess(decodedText, decodedResult.result?.format?.formatName || 'Unknown')

        // Small delay to ensure callback completes before closing
        setTimeout(() => {
          handleClose()
        }, 100)
      }

      // Define error callback
      const onScanFailure = (error: string) => {
        // Most errors are normal (no code in view), don't log them
        // console.log('Scan attempt:', error)
      }

      // Try multiple initialization approaches
      console.log('🎯 Attempting camera initialization...')

      // First try: Simple config with environment camera
      try {
        console.log('📱 Trying back camera first...')
        await scannerRef.current.start(
          { facingMode: { exact: "environment" } },
          {
            fps: 10,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
              // Square box for QR codes (90% of viewfinder)
              const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.9);
              return {
                width: size,
                height: size
              };
            },
            aspectRatio: 1.0,
            videoConstraints: {
              width: { ideal: 1920 }, // Higher resolution for better barcode detection
              height: { ideal: 1080 },
              facingMode: { exact: "environment" }
            }
          },
          handleScanSuccess,
          onScanFailure
        )
        setIsScanning(true)
        console.log('🚀 Back camera started successfully!')
        return
      } catch (envError) {
        console.error('💥 Back camera initialization failed:', envError)
        throw new Error('Back camera required for barcode scanning but failed to initialize: ' + envError.message)
      }

    } catch (error: any) {
      console.error('❌ Complete scanner initialization failed:', error)
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })

      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device')
      } else if (error.message?.includes('Permission denied')) {
        setCameraError('Camera permission denied. Please allow camera access.')
      } else if (error.message?.includes('container not found')) {
        setCameraError('Scanner interface not ready. Please try again.')
      } else {
        setCameraError('Failed to start camera: ' + (error.message || 'Unknown error. Check console for details.'))
      }
    }
  }

  const stopScanner = async () => {
    try {
      if (scannerRef.current && isScanning) {
        console.log('🛑 Stopping scanner...')
        await scannerRef.current.stop()
        await scannerRef.current.clear()
        scannerRef.current = null
        console.log('✅ Scanner stopped and cleared')
      }
    } catch (error) {
      console.error('Error stopping scanner:', error)
    }
  }

  const cleanupCamera = async () => {
    try {
      await stopScanner()
      setIsScanning(false)
      setCameraRequested(false)
    } catch (error) {
      console.error('Error cleaning up camera:', error)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim(), 'Manual')
      handleClose()
    }
  }

  const handleClose = () => {
    try {
      cleanupCamera()
      onClose()
      setCameraError(null)
      setShowManualInput(false)
      setManualInput('')
      setCameraRequested(false)
    } catch (error) {
      console.error('Error closing scanner:', error)
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-brand-primary-text">
              {cameraError ? 'Camera Error' : showManualInput ? 'Enter Barcode' : 'Scan Barcode'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-700/50 active:scale-95 touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            {showManualInput ? (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="manual-input" className="block text-sm font-medium text-brand-primary-text mb-2">
                    Enter barcode or asset ID:
                  </label>
                  <input
                    id="manual-input"
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type or paste the barcode here..."
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium active:scale-95 touch-manipulation transition-all"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 active:scale-95 touch-manipulation transition-all"
                  >
                    Camera
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-black min-h-[500px] flex items-center justify-center relative">
                  {/* HTML5-QRCode scanner container - always present */}
                  <div
                    id={scannerId}
                    className="w-full h-full absolute inset-0"
                    style={{
                      minHeight: '500px',
                      width: '100%',
                      height: '100%'
                    }}
                  />

                  {/* Scanning area indicator - large square for QR codes */}
                  {isScanning && !cameraError && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                      {/* Large square scanning box for QR codes */}
                      <div className="relative aspect-square" style={{ width: '90%', maxWidth: '500px' }}>
                        {/* Scanning box border */}
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
                        {/* Corner indicators */}
                        <div className="absolute left-0 top-0 w-8 h-8 border-l-4 border-t-4 border-blue-500"></div>
                        <div className="absolute right-0 top-0 w-8 h-8 border-r-4 border-t-4 border-blue-500"></div>
                        <div className="absolute left-0 bottom-0 w-8 h-8 border-l-4 border-b-4 border-blue-500"></div>
                        <div className="absolute right-0 bottom-0 w-8 h-8 border-r-4 border-b-4 border-blue-500"></div>
                      </div>
                    </div>
                  )}

                  {/* Camera Error Overlay */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10">
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center max-w-sm">
                        <div className="flex justify-center mb-3">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <p className="text-sm text-red-200 mb-3">{cameraError}</p>
                        <div className="space-x-3">
                          <button
                            onClick={initializeCamera}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium active:scale-95 touch-manipulation transition-all"
                          >
                            Try Again
                          </button>
                          <button
                            onClick={() => setShowManualInput(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium active:scale-95 touch-manipulation transition-all"
                          >
                            Manual
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State - Show immediately when modal opens */}
                  {!isScanning && !cameraError && !showManualInput && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
                        <p className="text-white text-base font-medium">Starting camera...</p>
                        <p className="text-white/80 text-sm mt-2">Please allow camera permissions</p>
                      </div>
                    </div>
                  )}

                </div>

                {isScanning && (
                  <div className="text-sm text-brand-secondary-text text-center space-y-2 mt-4">
                    <p className="font-medium text-brand-primary-text">
                      Center the QR code within the blue square box
                    </p>
                    <p className="text-xs opacity-80">
                      Tip: Keep the QR code flat and well-lit for best results
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center space-x-3 mt-6">
            {!cameraError && !showManualInput && (
              <button
                onClick={() => setShowManualInput(true)}
                className="px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
              >
                Enter Manually
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}