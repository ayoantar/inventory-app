'use client'

import { useState, useEffect } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useCart } from '@/contexts/cart-context'
import { useSession } from 'next-auth/react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatCategory, formatStatus } from '@/lib/utils'

interface CartConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<{ success: boolean; errors: string[] }>
}

interface Client {
  id: string
  name: string
  code: string
  contact?: string
  email?: string
}

export default function CartConfirmationModal({ isOpen, onClose, onConfirm }: CartConfirmationModalProps) {
  useScrollLock(isOpen)

  const { state, getCheckInItems, getCheckOutItems } = useCart()
  const { data: session } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)
  const [returnDates, setReturnDates] = useState<{ [key: string]: string | null }>({})
  const [indefiniteCheckouts, setIndefiniteCheckouts] = useState<{ [key: string]: boolean }>({})
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loadingClients, setLoadingClients] = useState(false)

  // Fetch clients when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingClients(true)
      fetch('/api/clients?active=true&limit=100')
        .then(res => res.json())
        .then(data => {
          setClients(data.clients || [])
        })
        .catch(err => {
          console.error('Failed to load clients:', err)
        })
        .finally(() => {
          setLoadingClients(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const checkInItems = getCheckInItems()
  const checkOutItems = getCheckOutItems()

  const handleDateChange = (assetId: string, date: string) => {
    setReturnDates(prev => ({ ...prev, [assetId]: date }))
    setIndefiniteCheckouts(prev => ({ ...prev, [assetId]: false }))
  }

  const handleIndefiniteToggle = (assetId: string, checked: boolean) => {
    setIndefiniteCheckouts(prev => ({ ...prev, [assetId]: checked }))
    if (checked) {
      setReturnDates(prev => ({ ...prev, [assetId]: null }))
    }
  }

  const getReturnDateForItem = (assetId: string): string | null => {
    if (indefiniteCheckouts[assetId]) return null
    return returnDates[assetId] || null
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      // Update cart items with return dates before confirming
      checkOutItems.forEach(item => {
        const returnDate = getReturnDateForItem(item.assetId)
        item.expectedReturnDate = returnDate ? new Date(returnDate).toISOString() : undefined
      })

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

  const generateCheckoutListExcel = () => {
    const timestamp = new Date()
    const dateStr = timestamp.toISOString().split('T')[0]

    // Prepare data for Excel
    const data: any[] = []

    // Add header information
    data.push(['EQUIPMENT CHECKOUT LIST'])
    data.push([`Generated: ${timestamp.toLocaleString()}`])
    data.push([`User: ${session?.user?.name || 'Unknown'} (${session?.user?.email || 'N/A'})`])
    if (selectedClient) {
      data.push([`Client: ${selectedClient.name} (${selectedClient.code})`])
    }
    data.push([]) // Empty row

    // Create main data table
    const tableData: any[] = []
    tableData.push(['Transaction Type', 'Asset Name', 'Serial Number', 'Category', 'User', 'Return Date', 'Value', 'Notes'])

    // Add checkout items
    checkOutItems.forEach(item => {
      const value = item.asset.currentValue || item.asset.purchasePrice || 0
      const returnDate = getReturnDateForItem(item.assetId)
      tableData.push([
        'CHECK OUT',
        item.asset.name,
        item.asset.serialNumber || 'N/A',
        formatCategory(item.asset.category),
        item.assignedUserName || session?.user?.name || 'N/A',
        returnDate ? new Date(returnDate).toLocaleDateString() : 'No return date',
        value,
        item.notes || ''
      ])
    })

    // Add checkin items
    checkInItems.forEach(item => {
      const value = item.asset.currentValue || item.asset.purchasePrice || 0
      tableData.push([
        'CHECK IN',
        item.asset.name,
        item.asset.serialNumber || 'N/A',
        formatCategory(item.asset.category),
        session?.user?.name || 'Current User',
        new Date().toLocaleDateString(), // Today as return date for check-ins
        value,
        item.notes || ''
      ])
    })

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create worksheet with header and data
    const ws = XLSX.utils.aoa_to_sheet([...data, [], ...tableData])

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Checkout List')

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `checkout-list-${dateStr}.xlsx`)
  }

  const generateCheckoutListCSV = () => {
    const timestamp = new Date()
    const dateStr = timestamp.toISOString().split('T')[0]

    // Prepare CSV content
    let csvContent = 'Type,Asset Name,Serial Number,Category,User,Return Date,Value,Notes\n'

    // Add checkout items
    checkOutItems.forEach(item => {
      const value = item.asset.currentValue || item.asset.purchasePrice || 0
      const returnDate = getReturnDateForItem(item.assetId)
      csvContent += `"CHECK OUT","${item.asset.name}","${item.asset.serialNumber || 'N/A'}","${formatCategory(item.asset.category)}","${item.assignedUserName || session?.user?.name || 'N/A'}","${returnDate ? new Date(returnDate).toLocaleDateString() : 'No return date'}","${value}","${item.notes || ''}"\n`
    })

    // Add checkin items
    checkInItems.forEach(item => {
      const value = item.asset.currentValue || item.asset.purchasePrice || 0
      csvContent += `"CHECK IN","${item.asset.name}","${item.asset.serialNumber || 'N/A'}","${formatCategory(item.asset.category)}","${session?.user?.name || 'Current User'}","${new Date().toLocaleDateString()}","${value}","${item.notes || ''}"\n`
    })

    // Create and download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `checkout-list-${dateStr}.csv`)
  }

  const generateQuotePDF = () => {
    const timestamp = new Date()
    const dateStr = timestamp.toISOString().split('T')[0]
    const totalValue = getTotalValue()

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set font styles
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')

    // Add logo/header
    pdf.setTextColor(255, 102, 0) // Orange color
    pdf.text('LSVR WAREHOUSE', 105, 20, { align: 'center' })

    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.text('EQUIPMENT QUOTE', 105, 30, { align: 'center' })

    // Add quote information
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Date: ${timestamp.toLocaleDateString()}`, 20, 45)
    pdf.text(`Time: ${timestamp.toLocaleTimeString()}`, 20, 50)
    pdf.text(`Quote #: ${Date.now().toString().slice(-8)}`, 20, 55)

    // Customer information
    pdf.text(`User: ${session?.user?.name || 'Unknown'}`, 120, 45)
    pdf.text(`Email: ${session?.user?.email || 'N/A'}`, 120, 50)
    if (selectedClient) {
      pdf.text(`Client: ${selectedClient.name}`, 120, 55)
    }

    // Add line separator
    pdf.setLineWidth(0.5)
    const separatorY = selectedClient ? 65 : 60
    pdf.line(20, separatorY, 190, separatorY)

    // Table headers
    let yPos = selectedClient ? 75 : 70
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text('Item', 20, yPos)
    pdf.text('Category', 100, yPos)
    pdf.text('Serial #', 135, yPos)
    pdf.text('Value', 170, yPos)

    // Add line under headers
    pdf.setLineWidth(0.2)
    pdf.line(20, yPos + 2, 190, yPos + 2)

    // Add items
    yPos += 8
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)

    state.items.forEach((item) => {
      const value = item.asset.currentValue || item.asset.purchasePrice || 0

      // Use text wrapping for long item names
      const nameLines = pdf.splitTextToSize(item.asset.name, 75) // Max width of 75 for item name

      // Print item name (may be multiple lines)
      pdf.text(nameLines, 20, yPos)

      // Print other fields on the first line only
      pdf.text(formatCategory(item.asset.category), 100, yPos)
      pdf.text(item.asset.serialNumber || 'N/A', 135, yPos)
      pdf.text(`$${value.toLocaleString()}`, 170, yPos)

      // Advance yPos based on number of lines in name
      yPos += Math.max(6, nameLines.length * 5)

      // Add new page if needed
      if (yPos > 260) {
        pdf.addPage()
        yPos = 20
      }
    })

    // Add total section
    yPos += 5
    pdf.setLineWidth(0.5)
    pdf.line(20, yPos, 190, yPos)

    yPos += 8
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)

    // Checkout summary
    if (checkOutItems.length > 0) {
      pdf.text(`Items Checking Out: ${checkOutItems.length}`, 20, yPos)
      const checkoutValue = checkOutItems.reduce((sum, item) => sum + (item.asset.currentValue || item.asset.purchasePrice || 0), 0)
      pdf.text(`Checkout Value: $${checkoutValue.toLocaleString()}`, 80, yPos)

      // Total value on the same line
      pdf.setFontSize(12)
      pdf.text('TOTAL VALUE:', 120, yPos)
      pdf.setTextColor(255, 102, 0) // Orange for total
      pdf.text(`$${totalValue.toLocaleString()}`, 170, yPos)
      pdf.setTextColor(0, 0, 0) // Reset to black
      pdf.setFontSize(11)

      yPos += 6
    }

    if (checkInItems.length > 0) {
      pdf.text(`Items Checking In: ${checkInItems.length}`, 20, yPos)
      yPos += 6
    }

    // Footer
    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.text('This quote is valid for reference purposes only.', 105, 270, { align: 'center' })
    pdf.text('Generated by LSVR Inventory Management System', 105, 275, { align: 'center' })
    pdf.text(`Page 1`, 105, 285, { align: 'center' })

    // Save PDF
    pdf.save(`equipment-quote-${dateStr}.pdf`)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 backdrop-blur-xl rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-brand-primary-text">
                  Confirm Transactions
                </h2>
                <p className="text-sm text-brand-secondary-text mt-1">
                  Review all assets before processing {state.items.length} transaction{state.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
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
              {/* Client Selection */}
              <div className="bg-blue-900/20 rounded-lg border border-blue-600/50 p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label htmlFor="client-select" className="block text-sm font-semibold text-brand-primary-text mb-2">
                      Client (Optional)
                    </label>
                    <p className="text-xs text-brand-secondary-text mb-3">
                      Associate these transactions with a client. This will appear on all documents and reports.
                    </p>
                    <select
                      id="client-select"
                      value={selectedClient?.id || ''}
                      onChange={(e) => {
                        const client = clients.find(c => c.id === e.target.value)
                        setSelectedClient(client || null)
                      }}
                      disabled={loadingClients || isProcessing}
                      className="block w-full px-4 py-2.5 bg-gray-800 border border-blue-600/30 rounded-lg text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingClients ? 'Loading clients...' : 'No client (default)'}
                      </option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.code})
                        </option>
                      ))}
                    </select>
                    {selectedClient && (
                      <div className="mt-2 text-xs text-blue-400 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Selected: {selectedClient.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-Out Items */}
              {checkOutItems.length > 0 && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-900/30 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-primary-text">
                        Assets to Check Out ({checkOutItems.length})
                      </h3>
                      <p className="text-sm text-brand-secondary-text">
                        These assets will be marked as checked out
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-900/20 rounded-lg border border-orange-600/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-orange-600/30">
                        <thead className="bg-orange-900/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-400 uppercase tracking-wider">
                              Asset
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-400 uppercase tracking-wider">
                              Assigned To
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-400 uppercase tracking-wider">
                              Return Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-orange-400 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-600/30">
                          {checkOutItems.map((item) => (
                            <tr key={item.assetId} className="hover:bg-orange-900/10">
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
                                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                                        <span className="text-sm">📦</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-brand-primary-text truncate">
                                      {item.asset.name}
                                    </p>
                                    <p className="text-xs text-brand-secondary-text truncate">
                                      {formatCategory(item.asset.category)} • {item.asset.serialNumber || 'No S/N'}
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
                                <div className="space-y-2">
                                  <input
                                    type="date"
                                    value={returnDates[item.assetId] || ''}
                                    onChange={(e) => handleDateChange(item.assetId, e.target.value)}
                                    disabled={indefiniteCheckouts[item.assetId]}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="block w-full px-3 py-1.5 bg-gray-900/50 border border-orange-600/30 rounded-md text-sm text-orange-100 placeholder-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 focus:bg-gray-900/70 hover:border-orange-500/50 hover:bg-gray-900/70 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-700/50 disabled:text-gray-500 disabled:bg-gray-900/30 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                  />
                                  <label className="flex items-center text-xs text-orange-300 cursor-pointer hover:text-orange-200 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={indefiniteCheckouts[item.assetId] || false}
                                      onChange={(e) => handleIndefiniteToggle(item.assetId, e.target.checked)}
                                      className="mr-2 rounded bg-gray-800 border-orange-600/50 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 checked:bg-orange-600 checked:border-orange-600 hover:border-orange-500 transition-colors"
                                    />
                                    No return date
                                  </label>
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
                    <div className="bg-green-900/30 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-primary-text">
                        Assets to Check In ({checkInItems.length})
                      </h3>
                      <p className="text-sm text-brand-secondary-text">
                        These assets will be returned and marked as available
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-lg border border-green-600/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-green-600/30">
                        <thead className="bg-green-900/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                              Asset
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                              Current Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                              Return Notes
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-600/30">
                          {checkInItems.map((item) => (
                            <tr key={item.assetId} className="hover:bg-orange-900/10">
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
                                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                                        <span className="text-sm">📦</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-brand-primary-text truncate">
                                      {item.asset.name}
                                    </p>
                                    <p className="text-xs text-brand-secondary-text truncate">
                                      {formatCategory(item.asset.category)} • {item.asset.serialNumber || 'No S/N'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400">
                                  {formatStatus(item.asset.status)}
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
          <div className="p-6 border-t border-gray-700 bg-gray-800/50">
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
              {/* Checkout List Options */}
              <div className="relative inline-block">
                <button
                  onClick={generateCheckoutListExcel}
                  disabled={isProcessing}
                  className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download List (.xlsx)
                </button>
              </div>

              <button
                onClick={generateCheckoutListCSV}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-1m4-8v8m4-8v8m4-8v8M9 3h6a2 2 0 012 2v1H7V5a2 2 0 012-2z" />
                </svg>
                Download List (.csv)
              </button>

              {/* Quote PDF */}
              <button
                onClick={generateQuotePDF}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download Quote (PDF)
              </button>

              <div className="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center ml-2">
                💡 Save these documents for your records
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

            <div className="mt-3 text-xs text-brand-secondary-text text-center">
              ⚠️ This action cannot be undone. Please review all details carefully.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}