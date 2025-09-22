import { PrismaClient } from '../../generated/prisma'
import { UserRole } from '../../generated/prisma'

// Enhanced Prisma client with connection pooling and performance optimization
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database scope helpers for user-based data isolation
export interface DatabaseScope {
  userId: string
  userRole: UserRole
  department?: string
}

export class DatabaseHelper {
  constructor(private scope: DatabaseScope) {}

  // Get assets with proper scoping
  async getAssets(where: any = {}) {
    const scopedWhere = this.applyScopeToAssets(where)
    
    return prisma.asset.findMany({
      where: scopedWhere,
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            transactions: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    })
  }

  // Get asset with ownership check
  async getAssetWithOwnershipCheck(assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        createdBy: true,
        lastModifiedBy: true,
      }
    })

    if (!asset) {
      return null
    }

    // Check if user can access this asset
    if (!this.canAccessAsset(asset)) {
      return null
    }

    return asset
  }

  // Get transactions with proper scoping
  async getTransactions(where: any = {}) {
    const scopedWhere = this.applyScopeToTransactions(where)
    
    return prisma.assetTransaction.findMany({
      where: scopedWhere,
      include: {
        asset: {
          select: { name: true, serialNumber: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })
  }

  // Get maintenance records with proper scoping
  async getMaintenanceRecords(where: any = {}) {
    const scopedWhere = this.applyScopeToMaintenance(where)
    
    return prisma.maintenanceRecord.findMany({
      where: scopedWhere,
      include: {
        asset: {
          select: { id: true, name: true, serialNumber: true }
        },
        performedBy: {
          select: { name: true, email: true }
        }
      }
    })
  }

  // Get asset groups with proper scoping
  async getAssetGroups(where: any = {}) {
    const scopedWhere = this.applyScopeToAssetGroups(where)
    
    return prisma.assetGroup.findMany({
      where: scopedWhere,
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        members: {
          include: {
            asset: {
              select: { id: true, name: true, serialNumber: true, status: true }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      }
    })
  }

  // Apply scoping rules to asset queries
  private applyScopeToAssets(where: any) {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
        // Admin sees everything
        return where

      case UserRole.MANAGER:
        // Manager sees everything (in future: could be department-scoped)
        return where

      case UserRole.USER:
        // Users see everything but modifications are limited by permissions
        return where

      case UserRole.VIEWER:
        // Viewers see everything (read-only enforced by permissions)
        return where

      default:
        // Default to no access
        return { ...where, id: 'never-match' }
    }
  }

  // Apply scoping rules to transaction queries
  private applyScopeToTransactions(where: any) {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
      case UserRole.MANAGER:
        return where

      case UserRole.USER:
        // Users can see all transactions but should focus on their own
        return where

      case UserRole.VIEWER:
        return where

      default:
        return { ...where, id: 'never-match' }
    }
  }

  // Apply scoping rules to maintenance queries
  private applyScopeToMaintenance(where: any) {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
      case UserRole.MANAGER:
        return where

      case UserRole.USER:
        return where

      case UserRole.VIEWER:
        return where

      default:
        return { ...where, id: 'never-match' }
    }
  }

  // Apply scoping rules to asset group queries
  private applyScopeToAssetGroups(where: any) {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
      case UserRole.MANAGER:
        return where

      case UserRole.USER:
        return where

      case UserRole.VIEWER:
        return where

      default:
        return { ...where, id: 'never-match' }
    }
  }

  // Check if user can access specific asset
  private canAccessAsset(asset: any): boolean {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
        return true

      case UserRole.MANAGER:
        // In future: check department
        return true

      case UserRole.USER:
      case UserRole.VIEWER:
        return true

      default:
        return false
    }
  }

  // Check if user can modify specific asset
  canModifyAsset(asset: any): boolean {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
      case UserRole.MANAGER:
        return true

      case UserRole.USER:
        // Users can modify assets they created or if they're the last modifier
        return asset.createdById === this.scope.userId || 
               asset.lastModifiedById === this.scope.userId

      case UserRole.VIEWER:
        return false

      default:
        return false
    }
  }

  // Check if user can delete specific asset
  canDeleteAsset(asset: any): boolean {
    switch (this.scope.userRole) {
      case UserRole.ADMIN:
        return true

      case UserRole.MANAGER:
        return true

      case UserRole.USER:
        // Users can only delete assets they created
        return asset.createdById === this.scope.userId

      case UserRole.VIEWER:
        return false

      default:
        return false
    }
  }
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Database cleanup and maintenance
export async function cleanupDatabase() {
  try {
    // Clean up expired sessions
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })

    // Clean up old verification tokens
    await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })

    console.log('Database cleanup completed')
  } catch (error) {
    console.error('Database cleanup failed:', error)
  }
}

// Initialize database (run on startup)
export async function initializeDatabase() {
  try {
    // Check connection
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to database')
    }

    // Run cleanup
    await cleanupDatabase()

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await prisma.$disconnect()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error closing database connection:', error)
  }
}