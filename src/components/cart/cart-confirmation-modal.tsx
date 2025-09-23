'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/cart-context'
import { useSession } from 'next-auth/react'

interface CartConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<{ success: boolean; errors: string[] }>
}

export default function CartConfirmationModal({ isOpen, onClose, onConfirm }: CartConfirmationModalProps) {
  const { state, getCheckInItems, getCheckOutItems } = useCart()
  const { data: session } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const checkInItems = getCheckInItems()
  const checkOutItems = getCheckOutItems()

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      const result = await onConfirm()
      
      if (result.success) {
        if (result.errors.length === 0) {
          // All successful, modal will close automatically
        } else {
          // Some errors occurred
          alert(`Processed with some errors:\n${result.errors.join('\n')}`)
        }
      } else {
        // Failed completely
        alert(`Failed to process transactions:\n${result.errors.join('\n')}`)
      }
    } catch (error) {
      console.error('Processing error:', error)
      alert('An error occurred while processing the transactions')
    } finally {
      setIsProcessing(false)
    }
  }

  const getTotalValue = () => {
    return state.items.reduce((total, item) => {
      return total + (item.asset.currentValue || item.asset.purchasePrice || 0)
    }, 0)
  }

  const generateCheckoutList = () => {
    const timestamp = new Date().toLocaleString()
    const totalValue = getTotalValue()
    
    let content = `EQUIPMENT CHECKOUT LIST\n`
    content += `Generated: ${timestamp}\n`
    content += `User: ${session?.user?.name || 'Unknown'} (${session?.user?.email || 'N/A'})\n`
    content += `\n${'='.repeat(60)}\n\n`

    if (checkOutItems.length > 0) {
      content += `CHECKING OUT (${checkOutItems.length} items):\n`
      content += `${'-'.repeat(40)}\n`
      
      checkOutItems.forEach((item, index) => {
        const value = item.asset.currentValue || item.asset.purchasePrice || 0
        content += `${index + 1}. ${item.asset.name}\n`
        content += `   Serial: ${item.asset.serialNumber || 'N/A'}\n`
        content += `   Category: ${item.asset.category.replace('_', ' ')}\n`
        content += `   Assigned to: ${item.assignedTo || 'N/A'}\n`
        content += `   Return by: ${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No due date'}\n`
        content += `   Value: $${value.toLocaleString()}\n`
        if (item.notes) content += `   Notes: ${item.notes}\n`
        content += `\n`
      })
      
      content += `Checkout Total Value: $${checkOutItems.reduce((sum, item) => sum + (item.asset.currentValue || item.asset.purchasePrice || 0), 0).toLocaleString()}\n\n`
    }

    if (checkInItems.length > 0) {
      content += `CHECKING IN (${checkInItems.length} items):\n`
      content += `${'-'.repeat(40)}\n`
      
      checkInItems.forEach((item, index) => {
        const value = item.asset.currentValue || item.asset.purchasePrice || 0
        content += `${index + 1}. ${item.asset.name}\n`
        content += `   Serial: ${item.asset.serialNumber || 'N/A'}\n`
        content += `   Category: ${item.asset.category.replace('_', ' ')}\n`
        content += `   Value: $${value.toLocaleString()}\n`
        if (item.notes) content += `   Return notes: ${item.notes}\n`
        content += `\n`
      })
    }

    content += `${'-'.repeat(60)}\n`
    content += `TOTAL TRANSACTION VALUE: $${totalValue.toLocaleString()}\n`
    content += `\n`
    content += `User Signature: _________________________ Date: _______\n`
    content += `\n`
    content += `Return Instructions:\n`
    content += `1. Use this list to identify items for return\n`
    content += `2. Scan QR codes or enter asset IDs in the cart\n`
    content += `3. Select "CHECK IN" for each item\n`
    content += `4. Process the return transaction\n`
    content += `\n`
    content += `For questions, contact the inventory administrator.\n`

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checkout-list-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const generateQuote = () => {
    const timestamp = new Date().toLocaleString()
    const totalValue = getTotalValue()
    
    let content = `EQUIPMENT CHECKOUT QUOTE\n`
    content += `Generated: ${timestamp}\n`
    content += `For: ${session?.user?.name || 'Unknown'} (${session?.user?.email || 'N/A'})\n`
    content += `\n${'='.repeat(60)}\n\n`

    content += `ITEM BREAKDOWN:\n`
    content += `${'-'.repeat(60)}\n`
    content += `${'Item'.padEnd(30)} ${'Category'.padEnd(15)} ${'Value'.padStart(10)}\n`
    content += `${'-'.repeat(60)}\n`

    state.items.forEach((item) => {
      const value = item.asset.currentValue || item.asset.purchasePrice || 0
      const name = item.asset.name.length > 29 ? item.asset.name.substring(0, 26) + '...' : item.asset.name
      const category = item.asset.category.replace('_', ' ')
      content += `${name.padEnd(30)} ${category.padEnd(15)} $${value.toLocaleString().padStart(9)}\n`
    })

    content += `${'-'.repeat(60)}\n`
    content += `${'TOTAL VALUE:'.padEnd(45)} $${totalValue.toLocaleString().padStart(9)}\n`
    content += `${'-'.repeat(60)}\n\n`

    content += `CHECKOUT DETAILS:\n`
    if (checkOutItems.length > 0) {
      content += `• Items checking out: ${checkOutItems.length}\n`
      content += `• Checkout value: $${checkOutItems.reduce((sum, item) => sum + (item.asset.currentValue || item.asset.purchasePrice || 0), 0).toLocaleString()}\n`
    }
    if (checkInItems.length > 0) {
      content += `• Items checking in: ${checkInItems.length}\n`
    }
    
    content += `\nThis quote is valid for reference purposes.\n`
    content += `Actual checkout requires confirmation and processing.\n`
    content += `\nGenerated by LSVR Inventory Management System\n`

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equipment-quote-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/5 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-brand-primary-text">
                  Confirm Transactions
                </h2>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text mt-1">
                  Review all assets before processing {state.items.length} transaction{state.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="text-white/50 hover:text-white/80 transition-colors hover disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Check-Out Items */}
              {checkOutItems.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-primary-text">
                        Assets to Check Out ({checkOutItems.length})
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">
                        These assets will be marked as checked out
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-orange-300">
                        <thead className="bg-orange-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                              Asset
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                              Assigned To
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                              Return Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-300">
                          {checkOutItems.map((item) => (
                            <tr key={item.assetId} className="hover">
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 mr-3 flex-shrink-0">
                                    {item.asset.imageUrl ? (
                                      <img
                                        src={item.asset.imageUrl}
                                        alt={item.asset.name}
                                        className="w-10 h-10 object-cover rounded-lg border border-gray-600"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-900/5 rounded-lg flex items-center justify-center">
                                        <span className="text-sm">📦</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-brand-primary-text truncate">
                                      {item.asset.name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-brand-secondary-text truncate">
                                      {item.asset.category.replace('_', ' ')} • {item.asset.serialNumber || 'No S/N'}
                                    </p>
                                    {item.notes && (
                                      <p className="text-xs text-gray-300 mt-1 italic">
                                        "{item.notes}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-brand-primary-text">
                                  {item.assignedUserName || session?.user?.name || session?.user?.email || 'Current User'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-brand-primary-text">
                                  {item.expectedReturnDate 
                                    ? new Date(item.expectedReturnDate).toLocaleDateString()
                                    : 'No date set'
                                  }
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-brand-primary-text">
                                  {(item.asset.currentValue || item.asset.purchasePrice) 
                                    ? `$${(item.asset.currentValue || item.asset.purchasePrice)?.toLocaleString()}`
                                    : '-'
                                  }
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Check-In Items */}
              {checkInItems.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-primary-text">
                        Assets to Check In ({checkInItems.length})
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">
                        These assets will be returned and marked as available
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-green-300">
                        <thead className="bg-green-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                              Asset
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                              Current Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                              Return Notes
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-300">
                          {checkInItems.map((item) => (
                            <tr key={item.assetId} className="hover">
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 mr-3 flex-shrink-0">
                                    {item.asset.imageUrl ? (
                                      <img
                                        src={item.asset.imageUrl}
                                        alt={item.asset.name}
                                        className="w-10 h-10 object-cover rounded-lg border border-gray-600"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-900/5 rounded-lg flex items-center justify-center">
                                        <span className="text-sm">📦</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-brand-primary-text truncate">
                                      {item.asset.name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-brand-secondary-text truncate">
                                      {item.asset.category.replace('_', ' ')} • {item.asset.serialNumber || 'No S/N'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {item.asset.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-brand-primary-text">
                                  {item.notes || 'No notes'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-brand-primary-text">
                                  {(item.asset.currentValue || item.asset.purchasePrice) 
                                    ? `$${(item.asset.currentValue || item.asset.purchasePrice)?.toLocaleString()}`
                                    : '-'
                                  }
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 bg-gray-900/5/50">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-brand-primary-text">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-brand-primary-text">Total Items:</span> {state.items.length}
                  </div>
                  <div>
                    <span className="font-medium text-brand-primary-text">Total Value:</span> ${getTotalValue().toLocaleString()}
                  </div>
                  {checkOutItems.length > 0 && (
                    <div>
                      <span className="font-medium text-brand-primary-text">Check-outs:</span> {checkOutItems.length}
                    </div>
                  )}
                  {checkInItems.length > 0 && (
                    <div>
                      <span className="font-medium text-brand-primary-text">Check-ins:</span> {checkInItems.length}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List and Quote Generation */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={generateCheckoutList}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-purple-600 hover disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Checkout List
              </button>
              
              <button
                onClick={generateQuote}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-green-600 hover disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Download Quote
              </button>
              
              <div className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center ml-2">
                💡 Use the checkout list to easily return these items later
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-brand-orange hover disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                    </svg>
                    Processing {state.items.length} Transaction{state.items.length !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm & Process All Transactions
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-600 dark:text-brand-secondary-text text-center">
              ⚠️ This action cannot be undone. Please review all details carefully.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}