'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScanner } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string, format: string) => void
  onScanError?: (error: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onScanError, isOpen, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [permissionRequested, setPermissionRequested] = useState(false)

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      initializeScanner()
    }

    return () => {
      handleStop()
    }
  }, [isOpen])

  const initializeScanner = async () => {
    try {
      setCameraError(null)
      const scanner = new Html5Qrcode('qr-scanner')
      scannerRef.current = scanner

      // Get available cameras
      const cameras = await Html5Qrcode.getCameras()
      if (cameras && cameras.length > 0) {
        // Use back camera if available (environment facing), otherwise use first camera
        const preferredCamera = cameras.find(camera =>
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('environment')
        ) || cameras[0]

        await startScanning(preferredCamera.id)
      } else {
        setCameraError('No cameras found on this device')
      }
    } catch (error: any) {
      console.error('Failed to initialize camera:', error)
      if (error.message?.includes('Permission denied')) {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else if (error.message?.includes('NotFoundError')) {
        setCameraError('No camera found on this device')
      } else if (error.message?.includes('NotAllowedError')) {
        setCameraError('Camera access was blocked. Please enable camera permissions.')
      } else {
        setCameraError('Camera initialization failed: ' + error.message)
      }
    }
  }

  const startScanning = async (cameraId: string) => {
    if (!scannerRef.current) return

    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Optimize for mobile
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      }

      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          console.log(`Code scanned: ${decodedText}`)
          onScanSuccess(decodedText, decodedResult.result.format?.formatName || 'Unknown')
          handleClose() // Auto-close on successful scan
        },
        (error) => {
          // Only log actual scanning errors, not "no code found" errors
          if (!error.includes('NotFoundException') && !error.includes('No MultiFormat Readers')) {
            console.warn(`Scanning error: ${error}`)
          }
        }
      )

      setIsScanning(true)
    } catch (error: any) {
      console.error('Failed to start scanning:', error)
      setCameraError('Failed to start camera: ' + error.message)
      if (onScanError) {
        onScanError('Failed to start scanning: ' + error.message)
      }
    }
  }

  const handleStop = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
      scannerRef.current = null
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    handleStop()
    onClose()
    setCameraError(null)
    setPermissionRequested(false)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark-blue/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">
              {cameraError ? 'Camera Error' : 'Scan Barcode'}
            </h3>
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
            {cameraError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-3">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200 mb-3">{cameraError}</p>
                <button
                  onClick={initializeScanner}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium active:scale-95 touch-manipulation transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div id="qr-scanner" className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-black min-h-[300px] flex items-center justify-center">
                  {!isScanning && (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-3"></div>
                      <p className="text-white text-sm">Initializing camera...</p>
                    </div>
                  )}
                </div>

                {isScanning && (
                  <div className="text-sm text-gray-600 dark:text-brand-secondary-text text-center space-y-2 mt-4">
                    <p className="font-medium text-gray-900 dark:text-brand-primary-text">
                      Point your camera at a barcode or QR code
                    </p>
                    <p className="text-xs opacity-80">
                      The scan will happen automatically when a code is detected
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
            >
              {cameraError ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}