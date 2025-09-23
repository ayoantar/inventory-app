'use client'

import { useState, useRef } from 'react'

interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: string[]
}

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ImportDialog({ isOpen, onClose, onSuccess }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        if (data.successful > 0) {
          onSuccess()
        }
      } else {
        setResult({
          total: 0,
          successful: 0,
          failed: 1,
          errors: [data.error || 'Import failed']
        })
      }
    } catch (error) {
      setResult({
        total: 0,
        successful: 0,
        failed: 1,
        errors: ['Network error occurred during import']
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setImporting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const downloadTemplate = () => {
    // Create a comprehensive Excel template with all supported columns
    const templateData = [
      // Headers with clear names
      ['name', 'description', 'category', 'manufacturer', 'model', 'serialNumber', 'barcode', 'location', 'purchaseDate', 'purchasePrice', 'currentValue', 'condition', 'status', 'notes'],
      // Sample data with all valid categories and statuses
      ['Canon EOS R5', 'Professional mirrorless camera', 'CAMERA', 'Canon', 'EOS R5', 'CAN123456', 'BAR001', 'Studio A', '2023-01-15', '3899.99', '3500.00', 'EXCELLENT', 'AVAILABLE', 'Main camera for photo shoots'],
      ['Sony 24-70mm Lens', 'Professional zoom lens', 'LENS', 'Sony', '24-70mm f/2.8', 'SON789012', 'BAR002', 'Studio A', '2023-02-20', '2200.00', '2000.00', 'GOOD', 'AVAILABLE', 'Primary lens for video work'],
      ['LED Light Panel', 'Professional lighting equipment', 'LIGHTING', 'Aputure', 'AL-MX', 'APU345678', 'BAR003', 'Studio B', '2023-03-10', '299.99', '280.00', 'EXCELLENT', 'CHECKED_OUT', 'Portable LED panel'],
      ['MacBook Pro M3', 'Editing workstation', 'COMPUTER', 'Apple', 'MacBook Pro 16"', 'APP456789', 'BAR004', 'Edit Bay 1', '2023-04-05', '2999.00', '2800.00', 'GOOD', 'IN_MAINTENANCE', 'Main editing machine'],
      ['Rode Microphone', 'Professional audio equipment', 'AUDIO', 'Rode', 'VideoMic Pro Plus', 'ROD567890', 'BAR005', 'Audio Room', '2023-05-12', '329.00', '300.00', 'FAIR', 'AVAILABLE', 'On-camera microphone']
    ]

    // Convert to CSV for simplicity (user can save as Excel)
    const csvContent = templateData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'asset-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/5 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-brand-primary-text">
              Import Assets from Excel
            </h2>
            <button
              onClick={handleClose}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!result ? (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Import Instructions
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload an Excel file (.xlsx or .xls) with asset data</li>
                  <li>• The file must have a header row with column names</li>
                  <li>• Required column: <strong>name</strong> (or variations like "asset name", "item name")</li>
                  <li>• Accepted categories: CAMERA, LENS, LIGHTING, AUDIO, COMPUTER, STORAGE, ACCESSORY, FURNITURE, SOFTWARE, OTHER</li>
                  <li>• Valid statuses: AVAILABLE, CHECKED_OUT, IN_MAINTENANCE, RETIRED, MISSING, RESERVED</li>
                  <li>• Valid conditions: EXCELLENT, GOOD, FAIR, POOR, NEEDS_REPAIR</li>
                  <li>• Duplicate asset names will be skipped</li>
                  <li>• Download the template below for the correct format</li>
                </ul>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-gray-900/5 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-brand-primary-text">
                    Need a template?
                  </h4>
                  <p className="text-sm text-brand-primary-text">
                    Download a sample CSV file with the correct format
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover border border-blue-300 rounded-md hover transition-colors"
                >
                  Download Template
                </button>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">
                  Select Excel File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-gray-400:border-gray-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-brand-primary-text">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-gray-900/5 rounded-md font-medium text-blue-600 hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          ref={fileInputRef}
                          name="file-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-brand-secondary-text">
                      Excel files (.xlsx, .xls) up to 10MB
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-green-800">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-green-600 hover"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Results */
            <div className="space-y-6">
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  result.failed === 0 
                    ? 'bg-green-100 text-green-800'
                    : result.successful === 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.failed === 0 ? 'Import Successful' : result.successful === 0 ? 'Import Failed' : 'Partial Import'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                  <div className="text-sm text-blue-800">Total Rows</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                  <div className="text-sm text-green-800">Successful</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                  <div className="text-sm text-red-800">Failed</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800 py-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-900 border border-gray-600 rounded-md hover transition-colors"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && file && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing...' : 'Import Assets'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}