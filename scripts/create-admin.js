const { PrismaClient } = require('../generated/prisma')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

function questionHidden(query) {
  return new Promise(resolve => {
    process.stdout.write(query)
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', function(data) {
      process.stdout.write('\n')
      resolve(data.toString().trim())
    })
    process.stdin.setRawMode(true)
    process.stdin.resume()
  })
}

async function createAdminUser() {
  try {
    console.log('🔧 LSVR Inventory - Admin User Creation')
    console.log('=====================================\n')

    // Check if any admin users exist
    const existingAdmins = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    })

    if (existingAdmins > 0) {
      console.log('⚠️  Active admin users already exist in the system.')
      const proceed = await question('Do you want to create another admin user? (y/N): ')
      if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
        console.log('Operation cancelled.')
        process.exit(0)
      }
      console.log('')
    }

    // Collect admin user information
    console.log('Please provide the following information for the new admin user:\n')
    
    const name = await question('Full Name: ')
    if (!name.trim()) {
      console.log('❌ Name is required.')
      process.exit(1)
    }

    const email = await question('Email Address: ')
    if (!email.trim() || !email.includes('@')) {
      console.log('❌ Valid email address is required.')
      process.exit(1)
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (existingUser) {
      console.log('❌ A user with this email already exists.')
      process.exit(1)
    }

    console.log('\nPassword Requirements:')
    console.log('• At least 8 characters long')
    console.log('• Must contain uppercase and lowercase letters')
    console.log('• Must contain at least one number')
    console.log('• Must contain at least one special character\n')

    const password = await question('Password: ')
    if (!password) {
      console.log('❌ Password is required.')
      process.exit(1)
    }

    const confirmPassword = await question('Confirm Password: ')
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match.')
      process.exit(1)
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      console.log('❌ Password does not meet requirements:')
      passwordValidation.errors.forEach(error => console.log(`   • ${error}`))
      process.exit(1)
    }

    const department = await question('Department (optional): ')

    // Create the admin user
    console.log('\n⏳ Creating admin user...')

    const hashedPassword = await bcrypt.hash(password, 12)

    const adminUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        department: department.trim() || null,
        isActive: true
      }
    })

    console.log('\n✅ Admin user created successfully!')
    console.log(`   Name: ${adminUser.name}`)
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Role: ${adminUser.role}`)
    if (adminUser.department) {
      console.log(`   Department: ${adminUser.department}`)
    }
    console.log(`   User ID: ${adminUser.id}`)
    
    console.log('\n🚀 You can now sign in to the LSVR Inventory system with these credentials.')
    console.log('   Make sure to keep this information secure!')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

function validatePassword(password) {
  const errors = []
  let isValid = true

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
    isValid = false
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
    isValid = false
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
    isValid = false
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers')
    isValid = false
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain special characters')
    isValid = false
  }

  return { isValid, errors }
}

// Run the script
createAdminUser()