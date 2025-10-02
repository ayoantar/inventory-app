/**
 * Utility functions for the LSVR Inventory Management System
 */

import { Session } from 'next-auth'

/**
 * Check if user has admin or manager role
 */
export function isAdminOrManager(session: Session | null): boolean {
  if (!session?.user) return false
  const userRole = (session.user as any)?.role
  return userRole === 'ADMIN' || userRole === 'MANAGER'
}

/**
 * Check if user has admin role
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false
  return (session.user as any)?.role === 'ADMIN'
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): string | null {
  if (!session?.user) return null
  return (session.user as any)?.role || null
}

/**
 * Get user initials from session
 */
export function getUserInitials(session: Session | null): string {
  if (!session?.user) return '?'
  const name = session.user.name
  const email = session.user.email

  if (name) {
    return name.charAt(0).toUpperCase()
  }
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  return '?'
}

/**
 * Format category name (replace underscores with spaces)
 */
export function formatCategory(category: string): string {
  return category.replace(/_/g, ' ')
}

/**
 * Format status name (replace underscores with spaces and capitalize)
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
}

/**
 * Get user's display name
 */
export function getUserDisplayName(session: Session | null, fallback: string = 'Unknown User'): string {
  if (!session?.user) return fallback
  return session.user.name || session.user.email || fallback
}

/**
 * Get asset display identifier (serial number, asset number, or ID)
 */
export function getAssetIdentifier(asset: { serialNumber?: string; assetNumber?: string; id: string }): string {
  return asset.serialNumber || asset.assetNumber || `Asset ${asset.id.slice(-4)}`
}

/**
 * Get badge color classes for asset status
 */
export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
    CHECKED_OUT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700',
    IN_MAINTENANCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    RETIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700',
    MISSING: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700',
    RESERVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700'
}

/**
 * Get badge color classes for maintenance status
 */
export function getMaintenanceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-gray-900/5 text-gray-600 dark:text-brand-secondary-text border-gray-700',
    OVERDUE: 'bg-red-50 text-red-700 border-red-200'
  }
  return colors[status] || 'bg-gray-900/5 text-gray-600 dark:text-brand-secondary-text border-gray-700'
}

/**
 * Get badge color classes for transaction status
 */
export function getTransactionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-amber-900/20 text-amber-400 border-amber-700',
    COMPLETED: 'bg-emerald-900/20 text-emerald-400 border-emerald-700',
    CANCELLED: 'bg-white/5 text-white/50 hover:text-white/80 transition-colors border-gray-600'
  }
  return colors[status] || 'bg-white/5 text-white/50 hover:text-white/80 transition-colors border-gray-600'
}

/**
 * Get badge color classes for transaction type
 */
export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    CHECK_OUT: 'bg-blue-900/20 text-blue-400 border-blue-700',
    CHECK_IN: 'bg-green-900/20 text-green-400 border-green-700'
  }
  return colors[type] || 'bg-white/5 text-white/50 hover:text-white/80 transition-colors border-gray-600'
}

/**
 * Get icon for category
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    CAMERA: '📷',
    LENS: '🔍',
    LIGHTING: '💡',
    AUDIO: '🎵',
    COMPUTER: '💻',
    STORAGE: '💾',
    ACCESSORY: '🔧',
    FURNITURE: '🪑',
    SOFTWARE: '💿',
    INFORMATION_TECHNOLOGY: '🖥️',
    OTHER: '📦'
  }
  return icons[category] || '📦'
}

/**
 * Get icon for maintenance type
 */
export function getMaintenanceTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    INSPECTION: '🔍',
    PREVENTIVE: '🛡️',
    CORRECTIVE: '🔧',
    CLEANING: '🧽',
    CALIBRATION: '⚖️'
  }
  return icons[type] || '🔧'
}
