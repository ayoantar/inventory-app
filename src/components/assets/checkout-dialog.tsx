'use client'

import { useState } from 'react'
import { Asset } from '../../../generated/prisma'

interface CheckoutDialogProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CheckoutDialog({ asset, isOpen, onClose, onSuccess }: CheckoutDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    notes: '',
    dueDate: '',
    assignedTo: ''
  })

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
          type: 'CHECK_OUT',
          ...formData
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
        setFormData({ notes: '', dueDate: '', assignedTo: '' })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to check out asset')
      }
    } catch (error) {
      setError('An error occurred while checking out the asset')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-50 dark:bg-white/5 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Check Out Asset</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="bg-gray-50 dark:bg-white/5 rounded-md p-3">
              <h3 className="font-medium text-gray-900 dark:text-brand-primary-text">{asset.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{asset.manufacturer} {asset.model}</p>
              {asset.serialNumber && (
                <p className="text-xs text-gray-700 dark:text-brand-secondary-text font-mono">{asset.serialNumber}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              placeholder="Person or department name"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this checkout..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 bg-gray-50 dark:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-600 hover:bg-white/10 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}