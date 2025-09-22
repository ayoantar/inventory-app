import { PrismaClient } from '../generated/prisma'
import { UserRole, AssetCategory, AssetStatus, AssetCondition } from '../generated/prisma'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Hash default password for all users
  const defaultPassword = await bcrypt.hash('password123', 12)

  // Create default clients
  const lsvrClient = await prisma.client.upsert({
    where: { code: 'LSVR' },
    update: {},
    create: {
      name: 'LSVR Productions',
      code: 'LSVR',
      description: 'Internal company assets',
      contact: 'Equipment Manager',
      email: 'equipment@lsvr.com',
    },
  })

  const acmeClient = await prisma.client.upsert({
    where: { code: 'ACME' },
    update: {},
    create: {
      name: 'ACME Studios',
      code: 'ACME',
      description: 'Client assets - ACME Studios partnership',
      contact: 'Sarah Johnson',
      email: 'assets@acmestudios.com',
    },
  })

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lsvr.com' },
    update: {
      password: defaultPassword,
      isActive: true,
    },
    create: {
      email: 'admin@lsvr.com',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      department: 'IT',
      password: defaultPassword,
      isActive: true,
    },
  })

  // Create sample users
  const manager = await prisma.user.upsert({
    where: { email: 'manager@lsvr.com' },
    update: {
      password: defaultPassword,
      isActive: true,
    },
    create: {
      email: 'manager@lsvr.com',
      name: 'Production Manager',
      role: UserRole.MANAGER,
      department: 'Production',
      password: defaultPassword,
      isActive: true,
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@lsvr.com' },
    update: {
      password: defaultPassword,
      isActive: true,
    },
    create: {
      email: 'john.doe@lsvr.com',
      name: 'John Doe',
      role: UserRole.USER,
      department: 'Post-Production',
      password: defaultPassword,
      isActive: true,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@lsvr.com' },
    update: {
      password: defaultPassword,
      isActive: true,
    },
    create: {
      email: 'jane.smith@lsvr.com',
      name: 'Jane Smith',
      role: UserRole.USER,
      department: 'Post-Production',
      password: defaultPassword,
      isActive: true,
    },
  })

  // Create sample assets
  const camera1 = await prisma.asset.create({
    data: {
      name: 'Canon EOS R5',
      description: 'Professional mirrorless camera with 45MP full-frame sensor',
      category: AssetCategory.CAMERA,
      serialNumber: 'CN-R5-001',
      barcode: '1234567890123',
      status: AssetStatus.AVAILABLE,
      location: 'Equipment Room A',
      purchaseDate: new Date('2023-01-15'),
      purchasePrice: 3899.99,
      currentValue: 3200.00,
      condition: AssetCondition.EXCELLENT,
      manufacturer: 'Canon',
      model: 'EOS R5',
      notes: 'Purchased with extended warranty',
      createdById: adminUser.id,
      lastModifiedById: adminUser.id,
    },
  })

  const lens1 = await prisma.asset.create({
    data: {
      name: 'Canon RF 24-70mm f/2.8L IS USM',
      description: 'Professional zoom lens with image stabilization',
      category: AssetCategory.LENS,
      serialNumber: 'CN-RF-2470-001',
      barcode: '1234567890124',
      status: AssetStatus.AVAILABLE,
      location: 'Equipment Room A',
      purchaseDate: new Date('2023-01-15'),
      purchasePrice: 2299.99,
      currentValue: 1950.00,
      condition: AssetCondition.EXCELLENT,
      manufacturer: 'Canon',
      model: 'RF 24-70mm f/2.8L IS USM',
      createdById: adminUser.id,
      lastModifiedById: adminUser.id,
    },
  })

  const light1 = await prisma.asset.create({
    data: {
      name: 'ARRI SkyPanel S60-C',
      description: 'LED softlight with color mixing technology',
      category: AssetCategory.LIGHTING,
      serialNumber: 'ARRI-S60-001',
      barcode: '1234567890125',
      status: AssetStatus.CHECKED_OUT,
      location: 'Studio B',
      purchaseDate: new Date('2022-11-20'),
      purchasePrice: 2995.00,
      currentValue: 2500.00,
      condition: AssetCondition.GOOD,
      manufacturer: 'ARRI',
      model: 'SkyPanel S60-C',
      notes: 'Includes barn doors and diffusion accessories',
      createdById: adminUser.id,
      lastModifiedById: adminUser.id,
    },
  })

  const computer1 = await prisma.asset.create({
    data: {
      name: 'MacBook Pro 16" M2 Max',
      description: 'High-performance laptop for video editing',
      category: AssetCategory.COMPUTER,
      serialNumber: 'MBP-M2-001',
      barcode: '1234567890126',
      status: AssetStatus.CHECKED_OUT,
      location: 'Edit Suite 1',
      purchaseDate: new Date('2023-03-10'),
      purchasePrice: 4299.99,
      currentValue: 3800.00,
      condition: AssetCondition.EXCELLENT,
      manufacturer: 'Apple',
      model: 'MacBook Pro 16" (2023)',
      notes: '64GB RAM, 2TB SSD, Space Gray',
      createdById: adminUser.id,
      lastModifiedById: adminUser.id,
    },
  })

  const microphone1 = await prisma.asset.create({
    data: {
      name: 'Shure SM7B',
      description: 'Dynamic microphone for broadcast and recording',
      category: AssetCategory.AUDIO,
      serialNumber: 'SHURE-SM7B-001',
      barcode: '1234567890127',
      status: AssetStatus.IN_MAINTENANCE,
      location: 'Audio Booth',
      purchaseDate: new Date('2022-08-05'),
      purchasePrice: 399.99,
      currentValue: 350.00,
      condition: AssetCondition.GOOD,
      manufacturer: 'Shure',
      model: 'SM7B',
      notes: 'Scheduled for routine maintenance',
      createdById: adminUser.id,
      lastModifiedById: adminUser.id,
    },
  })

  // Create sample transactions
  const transaction1 = await prisma.assetTransaction.create({
    data: {
      assetId: light1.id,
      userId: user1.id,
      type: 'CHECK_OUT',
      status: 'ACTIVE',
      checkOutDate: new Date('2024-01-20T09:00:00Z'),
      expectedReturnDate: new Date('2024-01-25T17:00:00Z'),
      notes: 'For studio shoot this week',
      location: 'Studio B',
    },
  })

  const transaction2 = await prisma.assetTransaction.create({
    data: {
      assetId: computer1.id,
      userId: user2.id,
      type: 'CHECK_OUT',
      status: 'ACTIVE',
      checkOutDate: new Date('2024-01-18T10:30:00Z'),
      expectedReturnDate: new Date('2024-01-30T17:00:00Z'),
      notes: 'Working on documentary project',
      location: 'Edit Suite 1',
    },
  })

  // Create sample maintenance records
  const maintenance1 = await prisma.maintenanceRecord.create({
    data: {
      assetId: microphone1.id,
      type: 'PREVENTIVE',
      description: 'Routine cleaning and inspection',
      scheduledDate: new Date('2024-01-22T14:00:00Z'),
      status: 'SCHEDULED',
      performedById: adminUser.id,
      createdById: adminUser.id,
      notes: 'Annual maintenance check',
      nextMaintenanceDate: new Date('2025-01-22T14:00:00Z'),
    },
  })

  const maintenance2 = await prisma.maintenanceRecord.create({
    data: {
      assetId: camera1.id,
      type: 'INSPECTION',
      description: 'Sensor cleaning and calibration check',
      scheduledDate: new Date('2024-02-01T11:00:00Z'),
      status: 'SCHEDULED',
      cost: 150.00,
      createdById: adminUser.id,
      notes: 'Quarterly maintenance',
      nextMaintenanceDate: new Date('2024-05-01T11:00:00Z'),
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`   - 4 users (1 admin, 1 manager, 2 regular users)`)
  console.log(`   - 5 assets (camera, lens, light, computer, microphone)`)
  console.log(`   - 2 active transactions`)
  console.log(`   - 2 maintenance records`)
  console.log('')
  console.log('🔐 Default login credentials:')
  console.log('   📧 admin@lsvr.com / password123 (Admin)')
  console.log('   📧 manager@lsvr.com / password123 (Manager)')
  console.log('   📧 john.doe@lsvr.com / password123 (User)')
  console.log('   📧 jane.smith@lsvr.com / password123 (User)')
  console.log('')
  console.log('⚠️  Remember to change these passwords in production!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })