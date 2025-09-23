'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/cart-context'
import { useSession } from 'next-auth/react'
import CartConfirmationModal from './cart-confirmation-modal'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface User {
  id: string
  name: string | null
  email: string | null
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { state, removeItem, updateItem, clearCart, processCart, getCheckInItems, getCheckOutItems } = useCart()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Load users for assignment dropdown
  useEffect(() => {
    if (isOpen && getCheckOutItems().length > 0) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/users?active=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleProcessConfirm = async () => {
    const result = await processCart()
    
    if (result.success && result.errors.length === 0) {
      // All successful - close both modals
      setShowConfirmation(false)
      onClose()
      
      // Show success message
      alert(`✅ Successfully processed ${state.items.length} transaction${state.items.length !== 1 ? 's' : ''}!`)
    }
    
    return result
  }

  const handleUpdateNotes = (assetId: string, notes: string) => {
    updateItem(assetId, { notes })
  }

  const handleUpdateReturnDate = (assetId: string, date: string) => {
    updateItem(assetId, { expectedReturnDate: date })
  }

  const handleUpdateAssignment = (assetId: string, userId: string) => {
    const user = users.find(u => u.id === userId)
    updateItem(assetId, { 
      assignedUserId: userId,
      assignedUserName: user?.name || user?.email || 'Unknown'
    })
  }

  const checkInItems = getCheckInItems()
  const checkOutItems = getCheckOutItems()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-900/5 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-primary-text">
              Transaction Cart
            </h2>
            <p className="text-sm text-gray-600 dark:text-brand-secondary-text">
              {state.items.length} item{state.items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white/80 transition-colors hover"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.items.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v0a2 2 0 002 2h8.5m-10.5-2v-2a2 2 0 012-2h8.5" />
              </svg>
              <p className="mt-2 text-sm text-gray-600 dark:text-brand-secondary-text">Your cart is empty</p>
              <p className="text-xs text-white/50 hover:text-white/80 transition-colors">Scan assets or add them from the asset list</p>
            </div>
          ) : (
            <>
              {/* Check-In Section */}
              {checkInItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check In ({checkInItems.length})
                  </h3>
                  <div className="space-y-2">
                    {checkInItems.map((item) => (
                      <div key={item.assetId} className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {item.asset.imageUrl ? (
                                <img
                                  src={item.asset.imageUrl}
                                  alt={item.asset.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-900/5 rounded flex items-center justify-center">
                                  <span className="text-xs">📦</span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-brand-primary-text truncate">
                                  {item.asset.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-brand-secondary-text">
                                  {item.asset.category.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            
                            {/* Notes Input */}
                            <div className="mt-2">
                              <textarea
                                placeholder="Return notes (optional)"
                                value={item.notes || ''}
                                onChange={(e) => handleUpdateNotes(item.assetId, e.target.value)}
                                className="w-full text-xs border border-gray-600 rounded px-2 py-1 bg-gray-900 text-brand-primary-text resize-none"
                                rows={2}
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.assetId)}
                            className="ml-2 text-red-400 hover p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check-Out Section */}
              {checkOutItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-brand-orange mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Check Out ({checkOutItems.length})
                  </h3>
                  <div className="space-y-2">
                    {checkOutItems.map((item) => (
                      <div key={item.assetId} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {item.asset.imageUrl ? (
                                <img
                                  src={item.asset.imageUrl}
                                  alt={item.asset.name}
                                  className="w-8 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-900/5 rounded flex items-center justify-center">
                                  <span className="text-xs">📦</span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-brand-primary-text truncate">
                                  {item.asset.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-brand-secondary-text">
                                  {item.asset.category.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            
                            {/* Assignment Dropdown */}
                            <div className="mt-2 space-y-2">
                              <select
                                value={item.assignedUserId || session?.user?.id || ''}
                                onChange={(e) => handleUpdateAssignment(item.assetId, e.target.value)}
                                className="w-full text-xs border border-gray-600 rounded px-2 py-1 bg-gray-900 text-brand-primary-text"
                                disabled={loadingUsers}
                              >
                                <option value={session?.user?.id || ''}>
                                  {session?.user?.name || session?.user?.email || 'Me'}
                                </option>
                                {users.filter(u => u.id !== session?.user?.id).map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name || user.email}
                                  </option>
                                ))}
                              </select>
                              
                              {/* Return Date */}
                              <input
                                type="date"
                                value={item.expectedReturnDate || ''}
                                onChange={(e) => handleUpdateReturnDate(item.assetId, e.target.value)}
                                className="w-full text-xs border border-gray-600 rounded px-2 py-1 bg-gray-900 text-brand-primary-text"
                                min={new Date().toISOString().split('T')[0]}
                              />
                              
                              {/* Notes */}
                              <textarea
                                placeholder="Checkout notes (optional)"
                                value={item.notes || ''}
                                onChange={(e) => handleUpdateNotes(item.assetId, e.target.value)}
                                className="w-full text-xs border border-gray-600 rounded px-2 py-1 bg-gray-900 text-brand-primary-text resize-none"
                                rows={2}
                              />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => removeItem(item.assetId)}
                            className="ml-2 text-red-400 hover p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {state.items.length > 0 && (
          <div className="p-4 border-t border-gray-700 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-brand-secondary-text">Total items:</span>
              <span className="font-medium text-brand-primary-text">{state.items.length}</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover transition-colors"
              >
                Clear All
              </button>
              
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={state.items.length === 0}
                className="flex-1 px-4 py-2 bg-brand-orange hover disabled:opacity-50 text-brand-primary-text rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Review & Process
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <CartConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleProcessConfirm}
      />
    </>
  )
}