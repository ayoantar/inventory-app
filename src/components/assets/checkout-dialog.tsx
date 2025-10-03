'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Asset } from '../../../generated/prisma'

interface CheckoutDialogProps {
  asset: Asset
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface User {
  id: string
  name: string | null
  email: string | null
  role: string
}

export default function CheckoutDialog({ asset, isOpen, onClose, onSuccess }: CheckoutDialogProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [formData, setFormData] = useState({
    notes: '',
    dueDate: '',
    userId: ''
  })

  // Get current user's role
  const currentUserRole = (session?.user as any)?.role
  const currentUserId = session?.user?.id
  const canAssignToOthers = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER'

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])

        // Auto-select current user for non-admin/non-manager users
        if (!canAssignToOthers && currentUserId) {
          setFormData(prev => ({ ...prev, userId: currentUserId }))
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

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
        setFormData({ notes: '', dueDate: '', userId: '' })
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-primary-text">Check Out Asset</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-700/50 active:scale-95 touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <h3 className="font-medium text-brand-primary-text">{asset.name}</h3>
              <p className="text-sm text-brand-secondary-text">{asset.manufacturer} {asset.model}</p>
              {asset.serialNumber && (
                <p className="text-xs text-brand-secondary-text font-mono mt-1">{asset.serialNumber}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-primary-text mb-2">
              Assigned To *
              {!canAssignToOthers && (
                <span className="ml-2 text-xs text-brand-secondary-text">(Auto-assigned to you)</span>
              )}
            </label>
            <select
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              disabled={loadingUsers || !canAssignToOthers}
              required
              className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingUsers ? 'Loading users...' : 'Select a user'}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} {user.role && `(${user.role})`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-primary-text mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-primary-text mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this checkout..."
              className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-brand-primary-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 transition-colors active:scale-95 touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
            >
              {loading ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}