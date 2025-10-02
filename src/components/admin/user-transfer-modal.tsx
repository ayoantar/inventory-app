'use client'

import { useState, useEffect } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  isActive: boolean
}

interface Transaction {
  id: string
  asset: {
    id: string
    name: string
    serialNumber: string | null
    category: string
  }
  createdAt: string
  expectedReturnDate: string | null
}

interface UserTransferModalProps {
  isOpen: boolean
  onClose: () => void
  userToDelete: User | null
  onTransferComplete: () => void
}

export default function UserTransferModal({
  useScrollLock(isOpen)

  isOpen,
  onClose,
  userToDelete,
  onTransferComplete
}: UserTransferModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    if (isOpen && userToDelete) {
      fetchUsers()
      fetchActiveTransactions()
    }
  }, [isOpen, userToDelete])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?active=true')
      if (response.ok) {
        const data = await response.json()
        // Filter out the user being deleted
        const availableUsers = data.users.filter((user: User) => 
          user.id !== userToDelete?.id && user.isActive
        )
        setUsers(availableUsers)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchActiveTransactions = async () => {
    if (!userToDelete) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userToDelete.id}/transfer`)
      if (response.ok) {
        const data = await response.json()
        setActiveTransactions(data.activeTransactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch active transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedUserId || !userToDelete) return

    try {
      setTransferring(true)
      const response = await fetch(`/api/users/${userToDelete.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: selectedUserId
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully transferred ${data.transferredCount} checked-out items to ${data.toUser.name || data.toUser.email}`)
        onTransferComplete()
        onClose()
      } else {
        const error = await response.json()
        alert(`Transfer failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Transfer failed:', error)
      alert('Transfer failed. Please try again.')
    } finally {
      setTransferring(false)
    }
  }

  const handleSkipTransfer = () => {
    if (confirm('Are you sure you want to skip the transfer? This will result in the user being deactivated instead of deleted.')) {
      onTransferComplete()
      onClose()
    }
  }

  if (!userToDelete) return null

  const selectedUser = users.find(user => user.id === selectedUserId)

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-2xl rounded-lg bg-gray-900 p-6 shadow-xl">
          <DialogTitle className="text-lg font-medium text-brand-primary-text mb-4">
            Transfer Checked-Out Items
          </DialogTitle>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Cannot delete user with checked-out items
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      <strong>{userToDelete.name || userToDelete.email}</strong> has {activeTransactions.length} checked-out item{activeTransactions.length !== 1 ? 's' : ''} that must be transferred to another user before deletion.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="text-white/50 hover:text-white/80 transition-colors">Loading transactions...</div>
              </div>
            ) : (
              <>
                {activeTransactions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-brand-primary-text mb-2">
                      Checked-out items ({activeTransactions.length}):
                    </h4>
                    <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg p-3 max-h-32 overflow-y-auto">
                      <div className="space-y-1">
                        {activeTransactions.map((transaction) => (
                          <div key={transaction.id} className="text-sm text-gray-300">
                            • {transaction.asset.name} {transaction.asset.serialNumber && `(${transaction.asset.serialNumber})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="transferUser" className="block text-sm font-medium text-gray-300 mb-2">
                    Transfer to user:
                  </label>
                  <select
                    id="transferUser"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>Selected:</strong> {selectedUser.name || selectedUser.email} ({selectedUser.role})
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSkipTransfer}
              className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover bg-gray-900 transition-colors"
            >
              Skip Transfer (Deactivate User)
            </button>

            <button
              onClick={handleTransfer}
              disabled={!selectedUserId || transferring || activeTransactions.length === 0}
              className="bg-blue-600 hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {transferring ? 'Transferring...' : `Transfer & Delete User`}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}