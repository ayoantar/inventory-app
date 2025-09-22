import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function cleanupDescriptions(dryRun: boolean = true) {
  console.log(`🧹 ${dryRun ? 'DRY RUN' : 'EXECUTING'}: Cleaning up redundant asset descriptions...`)
  
  try {
    // Find assets where description contains the format "number - name"
    const assetsToClean = await prisma.asset.findMany({
      where: {
        AND: [
          { description: { not: null } },
          { description: { not: '' } },
          { description: { contains: ' - ' } } // Contains the pattern we created
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        notes: true
      }
    })

    console.log(`\n📊 Found ${assetsToClean.length} assets with descriptions to clean`)

    if (assetsToClean.length === 0) {
      console.log('✅ No descriptions need cleaning!')
      return
    }

    // Show examples of what will change
    console.log(`\n📋 Examples of changes:`)
    console.log('======================')
    assetsToClean.slice(0, 5).forEach((asset, index) => {
      const parts = asset.description?.split(' - ') || []
      const assetNumber = parts[0]
      const nameInDescription = parts[1]
      
      console.log(`${index + 1}. Asset: ${asset.name}`)
      console.log(`   OLD Description: "${asset.description}"`)
      
      // If the name in description matches the current name, just keep asset number reference
      if (nameInDescription === asset.name) {
        console.log(`   NEW Description: "Asset #${assetNumber}" (keeping asset number reference)`)
      } else {
        console.log(`   NEW Description: "${asset.description}" (keeping as-is - doesn't match pattern)`)
      }
      console.log('')
    })

    if (dryRun) {
      console.log('🚨 This is a DRY RUN - no changes will be made')
      console.log('💡 Run with --execute to apply the changes')
      return
    }

    console.log('⚠️  EXECUTING CHANGES...')
    
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const asset of assetsToClean) {
      try {
        const parts = asset.description?.split(' - ') || []
        if (parts.length >= 2) {
          const assetNumber = parts[0]
          const nameInDescription = parts[1]
          
          // Only clean if the name in description matches the current name
          if (nameInDescription === asset.name) {
            await prisma.asset.update({
              where: { id: asset.id },
              data: {
                description: `Asset #${assetNumber}`
              }
            })
            successCount++
            
            if (successCount % 50 === 0) {
              console.log(`   ✅ Cleaned ${successCount} descriptions...`)
            }
          } else {
            skippedCount++
          }
        } else {
          skippedCount++
        }
      } catch (error) {
        console.error(`   ❌ Error updating asset ${asset.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n🎉 Completed!`)
    console.log(`   ✅ Successfully cleaned: ${successCount} descriptions`)
    console.log(`   ⏭️  Skipped (no pattern match): ${skippedCount} descriptions`)
    console.log(`   ❌ Errors: ${errorCount} descriptions`)

  } catch (error) {
    console.error('💥 Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Allow running with command line argument
const isDryRun = process.argv.includes('--execute') ? false : true

if (require.main === module) {
  cleanupDescriptions(isDryRun)
}

export { cleanupDescriptions }