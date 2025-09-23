'use client'

import { useState } from 'react'
import { Asset } from '../../../generated/prisma'

interface CheckinDialogProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CheckinDialog({ asset, isOpen, onClose, onSuccess }: CheckinDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: asset.id,
          type: 'CHECK_IN',
          notes
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
        setNotes('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to check in asset')
      }
    } catch (error) {
      setError('An error occurred while checking in the asset')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/5 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-primary-text">Check In Asset</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="bg-gray-900/5 rounded-md p-3">
              <h3 className="font-medium text-brand-primary-text">{asset.name}</h3>
              <p className="text-sm text-gray-300">{asset.manufacturer} {asset.model}</p>
              {asset.serialNumber && (
                <p className="text-xs text-gray-600 dark:text-brand-secondary-text font-mono">{asset.serialNumber}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Return Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Condition notes, issues found, etc..."
              className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover bg-gray-900/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}