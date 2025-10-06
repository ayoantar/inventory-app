import Link from 'next/link'

interface Transaction {
  id: string
  transactionNumber: string
  type: 'CHECK_OUT' | 'CHECK_IN'
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
  borrowDate: string
  expectedReturnDate?: string | null
  actualReturnDate?: string | null
  notes?: string | null
  asset: {
    id: string
    name: string
    assetNumber?: string | null
    category: string
  }
  user?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
  createdBy: {
    id: string
    name?: string | null
    email?: string | null
  }
}

interface MobileTransactionCardProps {
  transaction: Transaction
  onQuickReturn?: (transaction: Transaction) => void
}

const statusColors = {
  ACTIVE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

const typeColors = {
  CHECK_OUT: 'text-blue-600 dark:text-blue-400',
  CHECK_IN: 'text-green-600 dark:text-green-400'
}

export default function MobileTransactionCard({ transaction, onQuickReturn }: MobileTransactionCardProps) {
  const isOverdue = transaction.status === 'OVERDUE' ||
    (transaction.expectedReturnDate && new Date(transaction.expectedReturnDate) < new Date() && !transaction.actualReturnDate)

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

  const getDaysRemaining = (returnDate: string) => {
    const today = new Date()
    const dueDate = new Date(returnDate)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days remaining`
  }

  return (
    <div className={`bg-white dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border ${isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} p-4 space-y-3`}>
      {/* Header with transaction info and status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold ${typeColors[transaction.type]}`}>
              {transaction.type === 'CHECK_OUT' ? '↗' : '↙'} {transaction.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              #{transaction.transactionNumber}
            </span>
          </div>
          <Link
            href={`/assets/${transaction.asset.id}`}
            className="text-sm font-semibold text-brand-primary-text hover:text-blue-600 dark:hover:text-blue-400 mt-1 block"
          >
            {transaction.asset.name}
          </Link>
          {transaction.asset.assetNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Asset #{transaction.asset.assetNumber}
            </span>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[transaction.status]}`}>
          {transaction.status}
        </span>
      </div>

      {/* Transaction details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {transaction.user && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Assigned to:</span>
            <span className="ml-1 text-brand-primary-text font-medium">
              {transaction.user.name || transaction.user.email}
            </span>
          </div>
        )}

        {transaction.borrowDate && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Date:</span>
            <span className="ml-1 text-brand-primary-text">
              {formatDate(transaction.borrowDate)}
            </span>
          </div>
        )}

        {transaction.expectedReturnDate && !transaction.actualReturnDate && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Due:</span>
            <span className={`ml-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-brand-primary-text'}`}>
              {formatDate(transaction.expectedReturnDate)}
            </span>
          </div>
        )}

        {transaction.actualReturnDate && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Returned:</span>
            <span className="ml-1 text-green-600 dark:text-green-400">
              {formatDate(transaction.actualReturnDate)}
            </span>
          </div>
        )}
      </div>

      {/* Days remaining/overdue indicator */}
      {transaction.expectedReturnDate && !transaction.actualReturnDate && (
        <div className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {getDaysRemaining(transaction.expectedReturnDate)}
        </div>
      )}

      {/* Notes if present */}
      {transaction.notes && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            {transaction.notes}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {transaction.status === 'ACTIVE' && onQuickReturn && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onQuickReturn(transaction)}
            className="w-full px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Quick Return
          </button>
        </div>
      )}
    </div>
  )
}