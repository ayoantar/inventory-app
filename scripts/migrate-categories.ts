import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

// System categories that were previously enum values
const SYSTEM_CATEGORIES = [
  { id: 'CAMERA', name: 'Camera', description: 'Camera equipment and bodies' },
  { id: 'LENS', name: 'Lens', description: 'Camera lenses and optics' },
  { id: 'LIGHTING', name: 'Lighting', description: 'Lighting equipment and accessories' },
  { id: 'AUDIO', name: 'Audio', description: 'Audio recording and sound equipment' },
  { id: 'COMPUTER', name: 'Computer', description: 'Computers and computing devices' },
  { id: 'STORAGE', name: 'Storage', description: 'Storage devices and media' },
  { id: 'ACCESSORY', name: 'Accessory', description: 'General accessories and tools' },
  { id: 'FURNITURE', name: 'Furniture', description: 'Furniture and fixtures' },
  { id: 'SOFTWARE', name: 'Software', description: 'Software licenses and applications' },
  { id: 'INFORMATION_TECHNOLOGY', name: 'Information Technology', description: 'IT infrastructure and networking equipment' },
  { id: 'HEADSET', name: 'Headset', description: 'VR/AR headsets and related equipment' },
  { id: 'OTHER', name: 'Other', description: 'Other equipment not fitting above categories' }
]

async function main() {
  console.log('🔄 Starting category migration...')

  // Get first admin user to use as creator
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    throw new Error('No admin user found')
  }

  console.log(`📝 Using admin user: ${adminUser.email}`)

  // Create system categories in CustomCategory table
  console.log('📦 Creating system categories...')
  for (const cat of SYSTEM_CATEGORIES) {
    await prisma.customCategory.upsert({
      where: { id: cat.id },
      create: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        isActive: true,
        createdById: adminUser.id
      },
      update: {
        name: cat.name,
        description: cat.description
      }
    })
    console.log(`  ✅ ${cat.name}`)
  }

  console.log('✨ Migration complete!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
