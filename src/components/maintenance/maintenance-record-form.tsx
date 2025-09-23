'use client'

import { useState } from 'react'
import { MaintenanceType, MaintenanceStatus } from '../../../generated/prisma'

interface MaintenanceRecordFormProps {
  assetId: string
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  type: MaintenanceType
  description: string
  scheduledDate: string
  estimatedCost: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  notes: string
}

export default function MaintenanceRecordForm({ assetId, onSuccess, onCancel }: MaintenanceRecordFormProps) {
  const [formData, setFormData] = useState<FormData>({
    type: 'INSPECTION' as MaintenanceType,
    description: '',
    scheduledDate: '',
    estimatedCost: '',
    priority: 'MEDIUM',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          assetId,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : null
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to schedule maintenance')
      }
    } catch (error) {
      setError('An error occurred while scheduling maintenance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/5 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-brand-primary-text">Schedule Maintenance</h3>
            <button
              onClick={onCancel}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                Maintenance Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="INSPECTION">Inspection</option>
                <option value="REPAIR">Repair</option>
                <option value="CLEANING">Cleaning</option>
                <option value="CALIBRATION">Calibration</option>
                <option value="REPLACEMENT">Replacement</option>
                <option value="UPGRADE">Upgrade</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Brief description of maintenance needed"
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-300 mb-1">
                Scheduled Date
              </label>
              <input
                type="datetime-local"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Cost
              </label>
              <input
                type="number"
                id="estimatedCost"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes or details"
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover bg-gray-900/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? 'Scheduling...' : 'Schedule Maintenance'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}