import { UserRole } from '../../generated/prisma'

export interface Permission {
  action: string
  resource: string
  conditions?: Record<string, any>
}

export const PERMISSIONS = {
  // Asset permissions
  ASSETS_VIEW: { action: 'view', resource: 'assets' },
  ASSETS_CREATE: { action: 'create', resource: 'assets' },
  ASSETS_UPDATE: { action: 'update', resource: 'assets' },
  ASSETS_DELETE: { action: 'delete', resource: 'assets' },
  ASSETS_IMPORT: { action: 'import', resource: 'assets' },
  
  // Transaction permissions
  TRANSACTIONS_VIEW: { action: 'view', resource: 'transactions' },
  TRANSACTIONS_CREATE: { action: 'create', resource: 'transactions' },
  TRANSACTIONS_UPDATE: { action: 'update', resource: 'transactions' },
  TRANSACTIONS_DELETE: { action: 'delete', resource: 'transactions' },
  
  // Maintenance permissions
  MAINTENANCE_VIEW: { action: 'view', resource: 'maintenance' },
  MAINTENANCE_CREATE: { action: 'create', resource: 'maintenance' },
  MAINTENANCE_UPDATE: { action: 'update', resource: 'maintenance' },
  MAINTENANCE_DELETE: { action: 'delete', resource: 'maintenance' },
  
  // Asset group permissions
  ASSET_GROUPS_VIEW: { action: 'view', resource: 'asset_groups' },
  ASSET_GROUPS_CREATE: { action: 'create', resource: 'asset_groups' },
  ASSET_GROUPS_UPDATE: { action: 'update', resource: 'asset_groups' },
  ASSET_GROUPS_DELETE: { action: 'delete', resource: 'asset_groups' },
  
  // User management permissions
  USERS_VIEW: { action: 'view', resource: 'users' },
  USERS_CREATE: { action: 'create', resource: 'users' },
  USERS_UPDATE: { action: 'update', resource: 'users' },
  USERS_DELETE: { action: 'delete', resource: 'users' },
  
  // Report permissions
  REPORTS_VIEW: { action: 'view', resource: 'reports' },
  REPORTS_EXPORT: { action: 'export', resource: 'reports' },
  
  // System permissions
  SYSTEM_SETTINGS: { action: 'manage', resource: 'system' },
  AUDIT_LOGS: { action: 'view', resource: 'audit_logs' },
} as const

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admins can do everything
    ...Object.values(PERMISSIONS)
  ],
  
  [UserRole.MANAGER]: [
    // Managers can manage assets, transactions, maintenance, and view reports
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.ASSETS_DELETE,
    PERMISSIONS.ASSETS_IMPORT,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.TRANSACTIONS_UPDATE,
    PERMISSIONS.TRANSACTIONS_DELETE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.MAINTENANCE_DELETE,
    PERMISSIONS.ASSET_GROUPS_VIEW,
    PERMISSIONS.ASSET_GROUPS_CREATE,
    PERMISSIONS.ASSET_GROUPS_UPDATE,
    PERMISSIONS.ASSET_GROUPS_DELETE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  
  [UserRole.USER]: [
    // Users can view and create transactions (check in/out), limited asset management
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.ASSETS_CREATE,
    PERMISSIONS.ASSETS_UPDATE,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_CREATE,
    PERMISSIONS.TRANSACTIONS_UPDATE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.ASSET_GROUPS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  [UserRole.VIEWER]: [
    // Viewers can only view data
    PERMISSIONS.ASSETS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.ASSET_GROUPS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.some(p => 
    p.action === permission.action && p.resource === permission.resource
  )
}

export function checkPermissions(userRole: UserRole, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, permission))
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

// Resource ownership checks
export interface ResourceOwnershipContext {
  userId: string
  userRole: UserRole
  resourceOwnerId?: string
  departmentId?: string
}

export function canAccessResource(
  context: ResourceOwnershipContext,
  permission: Permission
): boolean {
  // Admin can access everything
  if (context.userRole === UserRole.ADMIN) {
    return hasPermission(context.userRole, permission)
  }

  // Check basic role permission first
  if (!hasPermission(context.userRole, permission)) {
    return false
  }

  // For update/delete operations, check ownership
  if (['update', 'delete'].includes(permission.action)) {
    // Users can only modify their own resources (except managers and admins)
    if (context.userRole === UserRole.USER || context.userRole === UserRole.VIEWER) {
      return context.resourceOwnerId === context.userId
    }
  }

  return true
}

// Data scoping based on user role
export interface DataScope {
  userIds?: string[]
  departmentIds?: string[]
  ownedOnly?: boolean
}

export function getDataScope(userRole: UserRole, userId: string, department?: string): DataScope {
  switch (userRole) {
    case UserRole.ADMIN:
      // Admin sees everything
      return {}
    
    case UserRole.MANAGER:
      // Manager sees everything in their department (if departments are implemented)
      // For now, managers see everything
      return {}
    
    case UserRole.USER:
      // Users see everything but can only modify their own data
      return {}
    
    case UserRole.VIEWER:
      // Viewers see everything but can't modify anything
      return {}
    
    default:
      // Default to owned resources only
      return { ownedOnly: true, userIds: [userId] }
  }
}