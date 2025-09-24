interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  department: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  _count: {
    createdAssets: number
    transactions: number
    maintenanceRecords: number
  }
}

interface MobileUserCardProps {
  user: User
  onToggleStatus: (userId: string, currentStatus: boolean) => void
  onEdit: (user: User) => void
  onPasswordReset: (user: User) => void
  onDelete: (user: User) => void
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'MANAGER':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'USER':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'VIEWER':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }
}

export default function MobileUserCard({ user, onToggleStatus, onEdit, onPasswordReset, onDelete }: MobileUserCardProps) {
  return (
    <div className="bg-white dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Header with avatar and status */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-brand-primary-text truncate">
              {user.name || 'No name'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </div>
            {user.department && (
              <div className="text-xs text-gray-600 dark:text-brand-secondary-text mt-0.5">
                {user.department}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
            {user.role}
          </span>
          <button
            onClick={() => onToggleStatus(user.id, user.isActive)}
            className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
              user.isActive
                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {user.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* User details */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="text-center">
          <div className="text-brand-primary-text font-semibold">{user._count.createdAssets}</div>
          <div className="text-gray-500 dark:text-gray-400">Assets</div>
        </div>
        <div className="text-center">
          <div className="text-brand-primary-text font-semibold">{user._count.transactions}</div>
          <div className="text-gray-500 dark:text-gray-400">Transactions</div>
        </div>
        <div className="text-center">
          <div className="text-brand-primary-text font-semibold">{user._count.maintenanceRecords}</div>
          <div className="text-gray-500 dark:text-gray-400">Maintenance</div>
        </div>
      </div>

      {/* Last login */}
      <div className="text-xs text-center">
        <span className="text-gray-500 dark:text-gray-400">Last login: </span>
        <span className="text-brand-primary-text">
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onEdit(user)}
          className="flex items-center justify-center px-2 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md transition-colors text-xs font-medium active:scale-95 touch-manipulation"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={() => onPasswordReset(user)}
          className="flex items-center justify-center px-2 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-md transition-colors text-xs font-medium active:scale-95 touch-manipulation"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h6m-6 0H9m12 0v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h4m6 0V7a2 2 0 112 2v0z" />
          </svg>
          Reset
        </button>
        <button
          onClick={() => onDelete(user)}
          className="flex items-center justify-center px-2 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md transition-colors text-xs font-medium active:scale-95 touch-manipulation"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}