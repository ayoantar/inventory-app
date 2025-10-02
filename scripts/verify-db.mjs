import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

async function verify() {
  try {
    const [assets, users, departments, clients, locations, groups, presets] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count(),
      prisma.department.count(),
      prisma.client.count(),
      prisma.location.count(),
      prisma.assetGroup.count(),
      prisma.preset.count()
    ])

    console.log('Database status after asset deletion:')
    console.log('- Assets:', assets)
    console.log('- Users:', users)
    console.log('- Departments:', departments)
    console.log('- Clients:', clients)
    console.log('- Locations:', locations)
    console.log('- Asset Groups:', groups)
    console.log('- Presets:', presets)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()
