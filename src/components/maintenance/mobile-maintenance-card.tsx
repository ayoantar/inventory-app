import Link from 'next/link'
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '../../../generated/prisma'
import { formatStatus } from '@/lib/utils'

interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  asset: { id: string; name: string; serialNumber: string | null }
  performedBy: { name: string | null; email: string | null } | null
  createdBy: { name: string | null; email: string | null }
}

interface MobileMaintenanceCardProps {
  maintenance: MaintenanceRecordWithRelations
  onStatusUpdate?: (id: string, status: MaintenanceStatus) => void
  onPriorityUpdate?: (id: string, priority: string) => void
}

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

const priorityColors = {
  LOW: 'text-green-600 dark:text-green-400',
  MEDIUM: 'text-yellow-600 dark:text-yellow-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  CRITICAL: 'text-red-600 dark:text-red-400'
}

const typeIcons = {
  INSPECTION: '🔍',
  PREVENTIVE: '🛠️',
  CORRECTIVE: '🔧',
  CLEANING: '🧽',
  CALIBRATION: '⚙️'
}

export default function MobileMaintenanceCard({ maintenance, onStatusUpdate, onPriorityUpdate }: MobileMaintenanceCardProps) {
  const isOverdue = maintenance.status === 'OVERDUE' ||
    (maintenance.scheduledDate && new Date(maintenance.scheduledDate) < new Date() && maintenance.status === 'SCHEDULED')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleStatusChange = (newStatus: MaintenanceStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(maintenance.id, newStatus)
    }
  }

  const handlePriorityChange = (newPriority: string) => {
    if (onPriorityUpdate) {
      onPriorityUpdate(maintenance.id, newPriority)
    }
  }

  return (
    <div className={`bg-white dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border ${isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} p-4 space-y-3`}>
      {/* Header with asset and status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-brand-orange">
              {typeIcons[maintenance.type]} {maintenance.type}
            </span>
          </div>
          <Link
            href={`/assets/${maintenance.asset.id}`}
            className="text-sm font-semibold text-brand-primary-text hover:text-blue-600 dark:hover:text-blue-400 mt-1 block"
          >
            {maintenance.asset.name}
          </Link>
          {maintenance.asset.serialNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              S/N: {maintenance.asset.serialNumber}
            </span>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[maintenance.status]}`}>
          {formatStatus(maintenance.status)}
        </span>
      </div>

      {/* Maintenance details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Priority:</span>
          <span className={`ml-1 font-semibold ${priorityColors[maintenance.priority as keyof typeof priorityColors]}`}>
            {maintenance.priority}
          </span>
        </div>

        {maintenance.scheduledDate && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Scheduled:</span>
            <span className={`ml-1 ${isOverdue && maintenance.status === 'SCHEDULED' ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-brand-primary-text'}`}>
              {formatDate(maintenance.scheduledDate)}
            </span>
          </div>
        )}

        {maintenance.performedDate && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Performed:</span>
            <span className="ml-1 text-green-600 dark:text-green-400">
              {formatDate(maintenance.performedDate)}
            </span>
          </div>
        )}

        {maintenance.performedBy && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Performed by:</span>
            <span className="ml-1 text-brand-primary-text font-medium">
              {maintenance.performedBy.name || maintenance.performedBy.email}
            </span>
          </div>
        )}

        {(maintenance.estimatedCost || maintenance.actualCost) && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Cost:</span>
            <span className="ml-1 text-brand-primary-text">
              {maintenance.actualCost ? formatCurrency(maintenance.actualCost) : `Est. ${formatCurrency(maintenance.estimatedCost)}`}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {maintenance.description && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            {maintenance.description}
          </p>
        </div>
      )}

      {/* Quick actions */}
      {maintenance.status !== 'COMPLETED' && maintenance.status !== 'CANCELLED' && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            {maintenance.status === 'SCHEDULED' && (
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="px-3 py-2 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
              >
                Start Work
              </button>
            )}
            {maintenance.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                className="px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Complete
              </button>
            )}
            <button
              onClick={() => handleStatusChange('CANCELLED')}
              className="px-3 py-2 text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}