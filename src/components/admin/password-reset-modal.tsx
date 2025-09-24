'use client'

import { useState } from 'react'

interface User {
  id: string
  name: string | null
  email: string | null
}

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function PasswordResetModal({ isOpen, onClose, user, onSuccess }: PasswordResetModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleReset = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setTempPassword(data.temporaryPassword)
        setShowSuccess(true)
        onSuccess()
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setTempPassword('')
    setShowSuccess(false)
    setLoading(false)
    onClose()
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-brand-primary-text">
              {showSuccess ? 'Password Reset Complete' : 'Reset Password'}
            </h3>
            <button
              onClick={handleClose}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showSuccess ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-brand-primary-text mb-4">
                  Are you sure you want to reset the password for:
                </p>
                <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg p-4">
                  <p className="font-medium text-brand-primary-text">
                    {user.name || 'Unnamed User'}
                  </p>
                  <p className="text-sm text-brand-primary-text">
                    {user.email}
                  </p>
                </div>
                <p className="text-sm text-brand-primary-text mt-4">
                  This will generate a new temporary password that you'll need to share with the user.
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-900 border border-gray-600 rounded-md hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover disabled:opacity-50 rounded-md transition-colors"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-brand-primary-text">
                    Password reset successfully for <strong>{user.name || user.email}</strong>
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Temporary Password:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm border border-gray-600 rounded px-3 py-2 text-sm font-mono text-brand-primary-text">
                      {tempPassword}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 text-sm text-blue-600 hover border border-blue-300 rounded hover transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    ⚠️ Please share this password securely with the user and ask them to change it immediately after login.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover rounded-md transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}