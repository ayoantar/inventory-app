export interface Asset {
  id: string;
  name: string;
  description?: string;
  category: AssetCategory;
  serialNumber?: string;
  barcode?: string;
  qrCode?: string;
  status: AssetStatus;
  location?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  condition: AssetCondition;
  manufacturer?: string;
  model?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface AssetTransaction {
  id: string;
  assetId: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  checkOutDate?: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  notes?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// MaintenanceRecord is now imported from Prisma generated types
// See src/lib/types.ts for the type export

export enum AssetCategory {
  CAMERA = 'camera',
  LENS = 'lens',
  LIGHTING = 'lighting',
  AUDIO = 'audio',
  COMPUTER = 'computer',
  STORAGE = 'storage',
  ACCESSORY = 'accessory',
  FURNITURE = 'furniture',
  SOFTWARE = 'software',
  OTHER = 'other'
}

export enum AssetStatus {
  AVAILABLE = 'available',
  CHECKED_OUT = 'checked_out',
  IN_MAINTENANCE = 'in_maintenance',
  RETIRED = 'retired',
  MISSING = 'missing',
  RESERVED = 'reserved'
}

export enum AssetCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  NEEDS_REPAIR = 'needs_repair'
}

export enum TransactionType {
  CHECK_OUT = 'check_out',
  CHECK_IN = 'check_in',
  RESERVATION = 'reservation',
  MAINTENANCE = 'maintenance',
  TRANSFER = 'transfer'
}

export enum TransactionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer'
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  CLEANING = 'cleaning'
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}