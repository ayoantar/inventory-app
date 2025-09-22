'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface QRGeneratorProps {
  data: string
  assetName?: string
  isOpen: boolean
  onClose: () => void
}

export default function QRGenerator({ data, assetName, isOpen, onClose }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && data && canvasRef.current) {
      generateQRCode()
    }
  }, [isOpen, data])

  const generateQRCode = async () => {
    try {
      setError('')
      
      if (!canvasRef.current) return

      // Generate QR code on canvas
      await QRCode.toCanvas(canvasRef.current, data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Also generate data URL for download
      const dataUrl = await QRCode.toDataURL(data, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrDataUrl(dataUrl)

    } catch (err) {
      console.error('Error generating QR code:', err)
      setError('Failed to generate QR code')
    }
  }

  const downloadQRCode = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.download = `${assetName ? `${assetName}-` : ''}qr-code.png`
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printQRCode = () => {
    if (!qrDataUrl) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${assetName || 'Asset'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              padding: 20px;
              border: 2px solid #333;
              border-radius: 8px;
              margin: 20px;
            }
            .qr-code {
              display: block;
              margin: 0 auto 10px;
            }
            .asset-info {
              font-size: 14px;
              color: #333;
              margin: 10px 0;
            }
            .asset-id {
              font-family: monospace;
              font-size: 12px;
              color: #666;
              word-break: break-all;
            }
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-code" style="width: 200px; height: 200px;" />
            ${assetName ? `<div class="asset-info"><strong>${assetName}</strong></div>` : ''}
            <div class="asset-id">${data}</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-gray-50 dark:bg-white/5 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">
              QR Code {assetName && `- ${assetName}`}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error ? (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-white rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
                <canvas 
                  ref={canvasRef}
                  className="block"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              
              <div className="text-sm text-gray-800 dark:text-gray-400 mb-4">
                <p className="font-medium mb-1">Asset ID:</p>
                <p className="font-mono text-xs break-all bg-gray-100 dark:bg-white/5 p-2 rounded">
                  {data}
                </p>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={downloadQRCode}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 bg-gray-50 dark:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={printQRCode}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 bg-gray-50 dark:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}