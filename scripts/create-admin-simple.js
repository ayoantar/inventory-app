const { PrismaClient } = require('../generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔧 LSVR Inventory - Creating Admin User')
    console.log('====================================\n')

    // Check if any admin users exist
    const existingAdmins = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    })

    if (existingAdmins > 0) {
      console.log('⚠️  Active admin users already exist in the system.')
      console.log('Existing admin count:', existingAdmins)
      process.exit(0)
    }

    // Default admin user details
    const adminData = {
      name: 'System Administrator',
      email: 'admin@lsvr.com',
      password: 'Admin123!', // Change this in production
      department: 'IT Administration'
    }

    console.log('Creating admin user with the following details:')
    console.log(`Name: ${adminData.name}`)
    console.log(`Email: ${adminData.email}`)
    console.log(`Password: ${adminData.password}`)
    console.log(`Department: ${adminData.department}`)
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n')

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    })

    if (existingUser) {
      console.log('❌ A user with this email already exists.')
      process.exit(1)
    }

    // Create the admin user
    console.log('⏳ Creating admin user...')

    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    const adminUser = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        role: 'ADMIN',
        department: adminData.department,
        isActive: true
      }
    })

    console.log('\n✅ Admin user created successfully!')
    console.log(`   Name: ${adminUser.name}`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   Department: ${adminUser.department}`)
    console.log(`   User ID: ${adminUser.id}`)
    
    console.log('\n🚀 You can now sign in to the LSVR Inventory system with:')
    console.log(`   Email: ${adminData.email}`)
    console.log(`   Password: ${adminData.password}`)
    console.log('\n🔒 SECURITY: Please change the password immediately after your first login!')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdminUser()