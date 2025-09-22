// Re-export all Prisma types from a consistent location
export type {
  User,
  Asset,
  AssetTransaction,
  MaintenanceRecord,
  AssetGroup,
  AssetGroupMember,
  Account,
  Session,
  VerificationToken
} from '../../generated/prisma'

export {
  UserRole,
  AssetCategory,
  AssetStatus,
  AssetCondition,
  TransactionType,
  TransactionStatus,
  MaintenanceType,
  MaintenanceStatus
} from '../../generated/prisma'