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
