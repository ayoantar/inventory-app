import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function examineAssetData() {
  console.log('🔍 Examining asset data structure...')
  
  try {
    // Get first 10 assets to examine the data pattern
    const assets = await prisma.asset.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true,
        manufacturer: true,
        model: true,
        category: true,
        notes: true
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log('\n📊 First 10 assets in database:')
    console.log('================================')
    
    assets.forEach((asset, index) => {
      console.log(`\n${index + 1}. Asset ID: ${asset.id}`)
      console.log(`   Name: "${asset.name}"`)
      console.log(`   Description: "${asset.description || 'NULL'}"`)
      console.log(`   Serial Number: "${asset.serialNumber || 'NULL'}"`)
      console.log(`   Manufacturer: "${asset.manufacturer || 'NULL'}"`)
      console.log(`   Model: "${asset.model || 'NULL'}"`)
      console.log(`   Category: ${asset.category}`)
      console.log(`   Notes: "${asset.notes || 'NULL'}"`)
      console.log('   ---')
    })

    // Count total assets
    const totalAssets = await prisma.asset.count()
    
    // Find assets where description looks like a proper name (these need fixing)
    const assetsWithDescriptiveDescriptions = await prisma.asset.findMany({
      where: {
        AND: [
          { description: { not: null } },   // Has description
          { description: { not: '' } }      // Description is not empty
        ]
      },
      take: 20,
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true
      }
    })

    console.log(`\n📈 Statistics:`)
    console.log(`   Total assets: ${totalAssets}`)
    console.log(`   Assets with descriptions (likely need fixing): ${assetsWithDescriptiveDescriptions.length}`)

    console.log(`\n🔧 Sample assets that likely need fixing:`)
    console.log('=========================================')
    assetsWithDescriptiveDescriptions.forEach((asset, index) => {
      console.log(`${index + 1}. ID: ${asset.id}`)
      console.log(`   Current Name: "${asset.name}" (should be moved to serialNumber)`)
      console.log(`   Description: "${asset.description}" (should be moved to name)`)
      console.log(`   Serial Number: "${asset.serialNumber || 'NULL'}"`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Error examining assets:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  examineAssetData()
}

export { examineAssetData }