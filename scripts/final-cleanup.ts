import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function finalCleanup(dryRun: boolean = true) {
  console.log(`🧹 ${dryRun ? 'DRY RUN' : 'EXECUTING'}: Final cleanup of asset descriptions...`)
  
  try {
    // Find assets with "Asset #" in description (these are the redundant ones we created)
    const assetsWithAssetNumbers = await prisma.asset.findMany({
      where: {
        description: {
          startsWith: 'Asset #'
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true
      }
    })

    console.log(`\n📊 Found ${assetsWithAssetNumbers.length} assets with "Asset #" descriptions to clean`)

    // Show examples
    if (assetsWithAssetNumbers.length > 0) {
      console.log(`\n📋 Examples of changes:`)
      console.log('======================')
      assetsWithAssetNumbers.slice(0, 5).forEach((asset, index) => {
        console.log(`${index + 1}. Asset: ${asset.name}`)
        console.log(`   OLD Description: "${asset.description}"`)
        console.log(`   NEW Description: null (removed redundant info)`)
        console.log(`   Serial Number: "${asset.serialNumber}" (unchanged)`)
        console.log('')
      })
    }

    // Also check for any assets that still have numeric names (didn't get fixed properly)
    const assetsWithNumericNames = await prisma.asset.findMany({
      where: {
        OR: [
          { name: { startsWith: '0' } },
          { name: { startsWith: '1' } },
          { name: { startsWith: '2' } },
          { name: { startsWith: '3' } },
          { name: { startsWith: '4' } },
          { name: { startsWith: '5' } }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true
      },
      take: 10
    })

    if (assetsWithNumericNames.length > 0) {
      console.log(`\n⚠️  Found ${assetsWithNumericNames.length} assets that may still need name fixes:`)
      console.log('==================================================================')
      assetsWithNumericNames.forEach((asset, index) => {
        console.log(`${index + 1}. ID: ${asset.id}`)
        console.log(`   Name: "${asset.name}" (may need fixing)`)
        console.log(`   Description: "${asset.description}"`)
        console.log(`   Serial: "${asset.serialNumber}"`)
        console.log('')
      })
    }

    if (dryRun) {
      console.log('🚨 This is a DRY RUN - no changes will be made')
      console.log('💡 Run with --execute to apply the changes')
      return
    }

    console.log('⚠️  EXECUTING CHANGES...')
    
    let successCount = 0
    let errorCount = 0

    // Clean up the "Asset #" descriptions
    for (const asset of assetsWithAssetNumbers) {
      try {
        await prisma.asset.update({
          where: { id: asset.id },
          data: {
            description: null // Remove redundant description
          }
        })
        successCount++
        
        if (successCount % 50 === 0) {
          console.log(`   ✅ Cleaned ${successCount} descriptions...`)
        }
      } catch (error) {
        console.error(`   ❌ Error updating asset ${asset.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n🎉 Completed!`)
    console.log(`   ✅ Successfully cleaned: ${successCount} descriptions`)
    console.log(`   ❌ Errors: ${errorCount} descriptions`)
    
    if (assetsWithNumericNames.length > 0) {
      console.log(`\n💡 Note: There are still ${assetsWithNumericNames.length} assets with potentially incorrect names that may need manual review.`)
    }

  } catch (error) {
    console.error('💥 Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Allow running with command line argument
const isDryRun = process.argv.includes('--execute') ? false : true

if (require.main === module) {
  finalCleanup(isDryRun)
}

export { finalCleanup }