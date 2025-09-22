'use client'

import { useState } from 'react'
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '../../../generated/prisma'
import MaintenanceDetailsModal from './maintenance-details-modal'

interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  asset: { id: string; name: string; serialNumber: string | null }
  performedBy: { name: string | null; email: string | null } | null
  createdBy: { name: string | null; email: string | null }
}

interface MaintenanceTableProps {
  maintenanceRecords: MaintenanceRecordWithRelations[]
  onStatusUpdate?: (id: string, status: MaintenanceStatus) => void
  onPriorityUpdate?: (id: string, priority: string) => void
  onUpdate?: (id: string, data: any) => Promise<void>
  showAssetColumn?: boolean
}

export default function MaintenanceTable({ 
  maintenanceRecords, 
  onStatusUpdate,
  onPriorityUpdate,
  onUpdate,
  showAssetColumn = true 
}: MaintenanceTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [updatingPriority, setUpdatingPriority] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecordWithRelations | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const handleStatusChange = async (id: string, newStatus: MaintenanceStatus) => {
    if (!onStatusUpdate) return
    
    setUpdatingStatus(id)
    try {
      await onStatusUpdate(id, newStatus)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handlePriorityChange = async (id: string, newPriority: string) => {
    if (!onPriorityUpdate) return
    
    setUpdatingPriority(id)
    try {
      await onPriorityUpdate(id, newPriority)
    } finally {
      setUpdatingPriority(null)
    }
  }

  const handleViewDetails = (record: MaintenanceRecordWithRelations) => {
    setSelectedRecord(record)
    setShowDetailsModal(true)
  }

  const statusColors = {
    SCHEDULED: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700',
    IN_PROGRESS: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700',
    COMPLETED: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700',
    CANCELLED: 'bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-brand-secondary-text border-gray-200 dark:border-brand-dark-blue-deep',
    OVERDUE: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700'
  }

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800 dark:bg-brand-dark-blue dark:text-brand-secondary-text',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const typeIcons = {
    INSPECTION: '🔍',
    PREVENTIVE: '🛡️',
    CORRECTIVE: '🔧',
    CLEANING: '🧽',
    CALIBRATION: '⚖️'
  }

  if (maintenanceRecords.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-brand-dark-blue-deep p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-brand-primary-text">No maintenance records</h3>
        <p className="mt-1 text-sm text-gray-700 dark:text-brand-secondary-text">
          No maintenance has been scheduled for this asset yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-white/5 shadow-sm rounded-lg border border-gray-300 dark:border-brand-dark-blue-deep overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-300 dark:divide-brand-dark-blue-deep border-collapse">
          <thead className="bg-gray-100 dark:bg-brand-dark-blue">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep">
                Type & Description
              </th>
              {showAssetColumn && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep">
                  Asset
                </th>
              )}
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep">
                Priority
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep">
                Scheduled
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider border-r border-gray-300 dark:border-brand-dark-blue-deep">
                Cost
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 dark:bg-white/5 divide-y divide-gray-300 dark:divide-brand-dark-blue-deep">
            {maintenanceRecords.map((record) => (
              <tr key={record.id}>
                <td className="px-3 py-3 border-r border-gray-300 dark:border-brand-dark-blue-deep">
                  <div className="flex items-start space-x-3">
                    <span className="text-lg" title={record.type}>
                      {typeIcons[record.type as MaintenanceType]}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                        {record.description}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-brand-secondary-text capitalize">
                        {record.type.toLowerCase().replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </td>
                {showAssetColumn && (
                  <td className="px-3 py-3 border-r border-gray-300 dark:border-brand-dark-blue-deep">
                    <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                      {record.asset.name}
                    </div>
                    {record.asset.serialNumber && (
                      <div className="text-sm text-gray-700 dark:text-brand-secondary-text font-mono">
                        {record.asset.serialNumber}
                      </div>
                    )}
                  </td>
                )}
                <td className="px-3 py-3 border-r border-gray-300 dark:border-brand-dark-blue-deep">
                  {onPriorityUpdate ? (
                    <select
                      value={record.priority}
                      onChange={(e) => handlePriorityChange(record.id, e.target.value)}
                      disabled={updatingPriority === record.id}
                      className={`text-xs font-medium rounded-full px-2.5 py-0.5 border focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${priorityColors[record.priority as keyof typeof priorityColors]}`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.25rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1rem 1rem',
                        paddingRight: '1.5rem'
                      }}
                    >
                      <option value="LOW" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Low</option>
                      <option value="MEDIUM" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Medium</option>
                      <option value="HIGH" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">High</option>
                      <option value="CRITICAL" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Critical</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[record.priority as keyof typeof priorityColors]}`}>
                      {record.priority}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-brand-primary-text">
                  {record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                </td>
                <td className="px-3 py-3 border-r border-gray-300 dark:border-brand-dark-blue-deep">
                  {onStatusUpdate ? (
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(record.id, e.target.value as MaintenanceStatus)}
                      disabled={updatingStatus === record.id}
                      className={`text-xs font-medium rounded-full px-2.5 py-0.5 border focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${statusColors[record.status as MaintenanceStatus]}`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.25rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1rem 1rem',
                        paddingRight: '1.5rem'
                      }}
                    >
                      <option value="SCHEDULED" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Scheduled</option>
                      <option value="IN_PROGRESS" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">In Progress</option>
                      <option value="COMPLETED" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Completed</option>
                      <option value="CANCELLED" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Cancelled</option>
                      <option value="OVERDUE" className="text-gray-900 dark:text-brand-primary-text bg-white dark:bg-white/5">Overdue</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[record.status as MaintenanceStatus]}`}>
                      {record.status.replace('_', ' ')}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 border-r border-gray-300 dark:border-brand-dark-blue-deep text-sm">
                  {record.cost ? (
                    <span className="font-medium text-gray-900 dark:text-brand-primary-text">
                      ${(record.cost || 0).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-gray-600 dark:text-brand-secondary-text italic">No cost recorded</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => handleViewDetails(record)}
                    className="p-1.5 text-gray-600 dark:text-brand-secondary-text hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="View Details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Maintenance Details Modal */}
      {selectedRecord && (
        <MaintenanceDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedRecord(null)
          }}
          record={selectedRecord}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}