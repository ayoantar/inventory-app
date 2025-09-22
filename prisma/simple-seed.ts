import { PrismaClient } from '../generated/prisma'
import { UserRole } from '../generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

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

  // Hash password for admin users
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user with password
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lsvr.com' },
    update: {},
    create: {
      email: 'admin@lsvr.com',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      department: 'IT',
      password: hashedPassword,
    },
  })

  // Create manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@lsvr.com' },
    update: {},
    create: {
      email: 'manager@lsvr.com',
      name: 'Production Manager',
      role: UserRole.MANAGER,
      department: 'Production',
      password: hashedPassword,
    },
  })

  // Create regular users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@lsvr.com' },
    update: {},
    create: {
      email: 'john.doe@lsvr.com',
      name: 'John Doe',
      role: UserRole.USER,
      department: 'Post-Production',
      password: hashedPassword,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@lsvr.com' },
    update: {},
    create: {
      email: 'jane.smith@lsvr.com',
      name: 'Jane Smith',
      role: UserRole.USER,
      department: 'Post-Production', 
      password: hashedPassword,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`   - 4 users (1 admin, 1 manager, 2 regular users)`)
  console.log(`   - 1 client (LSVR Productions)`)
  console.log('')
  console.log('🔑 Login Credentials:')
  console.log('   Admin: admin@lsvr.com / admin123')
  console.log('   Manager: manager@lsvr.com / admin123')
  console.log('   User: john.doe@lsvr.com / admin123')
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