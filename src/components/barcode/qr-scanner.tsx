'use client'

import { useEffect, useRef, useState } from 'react'

interface QRScannerProps {
  onScanSuccess: (decodedText: string, format: string) => void
  onScanError?: (error: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onScanError, isOpen, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [cameraRequested, setCameraRequested] = useState(false)

  useEffect(() => {
    if (isOpen && !cameraRequested) {
      // Don't auto-initialize camera, wait for user action
      console.log('QR Scanner opened, waiting for user to start camera')
    } else if (!isOpen) {
      cleanupCamera()
      setCameraRequested(false)
    }

    return () => {
      cleanupCamera()
    }
  }, [isOpen, cameraRequested])

  const initializeCamera = async () => {
    try {
      console.log('Starting camera initialization...')
      setCameraError(null)
      setCameraRequested(true)

      // Check if camera API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported')
        setCameraError('Camera not supported in this browser')
        return
      }

      console.log('Requesting camera permissions...')

      // Request camera access
      const constraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera stream acquired successfully')
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('Video source set, attempting to play...')
        await videoRef.current.play()
        setIsScanning(true)
        console.log('Camera started successfully')
      } else {
        console.error('Video element ref is null')
        setCameraError('Video element not found')
      }

    } catch (error: any) {
      console.error('Camera initialization failed:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })

      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.')
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device')
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera is already in use by another application')
      } else if (error.name === 'OverconstrainedError') {
        setCameraError('Camera constraints not supported')
      } else {
        setCameraError('Failed to access camera: ' + (error.message || 'Unknown error'))
      }
    }
  }

  const cleanupCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsScanning(false)
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
      <div className="bg-white dark:bg-brand-dark-blue/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">
              {cameraError ? 'Camera Error' : showManualInput ? 'Enter Barcode' : 'Scan Barcode'}
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
                    Enter Manually
                  </button>
                </div>
              </div>
            ) : showManualInput ? (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="manual-input" className="block text-sm font-medium text-gray-900 dark:text-brand-primary-text mb-2">
                    Enter barcode or asset ID:
                  </label>
                  <input
                    id="manual-input"
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type or paste the barcode here..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:scale-95 touch-manipulation transition-all"
                  >
                    Camera
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-black min-h-[300px] flex items-center justify-center">
                  {isScanning ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                  ) : cameraRequested ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-3"></div>
                      <p className="text-white text-sm">Initializing camera...</p>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="mb-4">
                        <svg className="w-16 h-16 text-white/60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-white text-sm mb-4">Ready to scan barcode or QR code</p>
                      <button
                        onClick={initializeCamera}
                        className="px-6 py-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg font-medium active:scale-95 touch-manipulation transition-all"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>

                {isScanning && (
                  <div className="text-sm text-gray-600 dark:text-brand-secondary-text text-center space-y-2 mt-4">
                    <p className="font-medium text-gray-900 dark:text-brand-primary-text">
                      Position the barcode or QR code in front of the camera
                    </p>
                    <p className="text-xs opacity-80">
                      You can also enter the code manually if scanning doesn't work
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
              >
                Enter Manually
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}