'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '../../../generated/prisma'

interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  asset: { id: string; name: string; serialNumber: string | null }
  performedBy: { name: string | null; email: string | null } | null
  createdBy: { name: string | null; email: string | null }
}

interface MaintenanceDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  record: MaintenanceRecordWithRelations
  onUpdate?: (id: string, data: any) => Promise<void>
}

export default function MaintenanceDetailsModal({
  isOpen,
  onClose,
  record,
  onUpdate
}: MaintenanceDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: record.status,
    priority: record.priority,
    actualCost: record.actualCost || '',
    completionNotes: record.completionNotes || '',
    notes: record.notes || '',
    performedDate: record.performedDate ? new Date(record.performedDate).toISOString().slice(0, 16) : ''
  })

  useEffect(() => {
    setFormData({
      status: record.status,
      priority: record.priority,
      actualCost: record.actualCost || '',
      completionNotes: record.completionNotes || '',
      notes: record.notes || '',
      performedDate: record.performedDate ? new Date(record.performedDate).toISOString().slice(0, 16) : ''
    })
  }, [record])

  const handleSave = async () => {
    if (!onUpdate) return
    
    setLoading(true)
    try {
      const updateData: any = {
        status: formData.status,
        priority: formData.priority,
        notes: formData.notes,
        completionNotes: formData.completionNotes
      }
      
      if (formData.actualCost) {
        updateData.actualCost = parseFloat(formData.actualCost.toString())
      }
      
      if (formData.performedDate) {
        updateData.performedDate = formData.performedDate
      }
      
      await onUpdate(record.id, updateData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update maintenance record:', error)
      alert('Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      status: record.status,
      priority: record.priority,
      actualCost: record.actualCost || '',
      completionNotes: record.completionNotes || '',
      notes: record.notes || '',
      performedDate: record.performedDate ? new Date(record.performedDate).toISOString().slice(0, 16) : ''
    })
    setIsEditing(false)
  }
  const statusColors = {
    SCHEDULED: 'bg-blue-50 text-blue-700',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
    COMPLETED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-gray-900/5 text-brand-primary-text',
    OVERDUE: 'bg-red-50 text-red-700'
  }

  const priorityColors = {
    LOW: 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800'
  }

  const typeIcons = {
    INSPECTION: '🔍',
    PREVENTIVE: '🛡️',
    CORRECTIVE: '🔧',
    CLEANING: '🧽',
    CALIBRATION: '⚖️'
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white flex items-center"
                  >
                    <span className="text-2xl mr-3">
                      {typeIcons[record.type as MaintenanceType]}
                    </span>
                    Maintenance Details
                  </Dialog.Title>
                  <div className="flex items-center space-x-2">
                    {onUpdate && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="text-white/50 hover:text-white/80 transition-colors hover"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                        {record.description}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Asset
                      </label>
                      <div className="bg-gray-900/5 p-3 rounded-lg">
                        <p className="text-sm font-medium text-white">
                          {record.asset.name}
                        </p>
                        {record.asset.serialNumber && (
                          <p className="text-xs text-white/50 hover:text-white/80 transition-colors font-mono">
                            SN: {record.asset.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as MaintenanceStatus }))}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="OVERDUE">Overdue</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[record.status as MaintenanceStatus]}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[record.priority as keyof typeof priorityColors]}`}>
                          {record.priority}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Type
                      </label>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {record.type.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Scheduled Date
                      </label>
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                        {formatDate(record.scheduledDate)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Performed Date
                      </label>
                      {isEditing ? (
                        <input
                          type="datetime-local"
                          value={formData.performedDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, performedDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                          {formatDate(record.performedDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estimated Cost
                      </label>
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                        {formatCurrency(record.cost)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Actual Cost *
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.actualCost}
                            onChange={(e) => setFormData(prev => ({ ...prev, actualCost: e.target.value }))}
                            className="w-full pl-8 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                          {formatCurrency(record.actualCost)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* People */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Created By
                      </label>
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                        {record.createdBy.name || record.createdBy.email || 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Performed By
                      </label>
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg">
                        {record.performedBy?.name || record.performedBy?.email || 'Not assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Add maintenance notes..."
                      />
                    ) : (
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg whitespace-pre-wrap min-h-[3rem]">
                        {record.notes || 'No notes'}
                      </p>
                    )}
                  </div>

                  {/* Completion Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Completion Notes *
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={formData.completionNotes}
                        onChange={(e) => setFormData(prev => ({ ...prev, completionNotes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Add completion notes (what was done, parts used, etc.)..."
                      />
                    ) : (
                      <p className="text-sm text-white bg-gray-900/5 p-3 rounded-lg whitespace-pre-wrap min-h-[3rem]">
                        {record.completionNotes || 'No completion notes'}
                      </p>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-white/50 hover:text-white/80 transition-colors">
                      <div>
                        <strong>Created:</strong> {formatDate(record.createdAt)}
                      </div>
                      <div>
                        <strong>Last Updated:</strong> {formatDate(record.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-300 hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}