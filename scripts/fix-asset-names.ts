import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function fixAssetNames(dryRun: boolean = true) {
  console.log(`🔧 ${dryRun ? 'DRY RUN' : 'EXECUTING'}: Fixing asset name/description mapping...`)
  
  try {
    // Find assets where description exists (these are the ones that need fixing)
    const assetsToFix = await prisma.asset.findMany({
      where: {
        AND: [
          { description: { not: null } },   // Has description
          { description: { not: '' } }      // Description is not empty
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true
      }
    })

    console.log(`\n📊 Found ${assetsToFix.length} assets that need fixing`)

    if (assetsToFix.length === 0) {
      console.log('✅ No assets need fixing!')
      return
    }

    // Show first 5 examples
    console.log(`\n📋 Examples of changes that will be made:`)
    console.log('==========================================')
    assetsToFix.slice(0, 5).forEach((asset, index) => {
      console.log(`${index + 1}. Asset ID: ${asset.id}`)
      console.log(`   OLD - Name: "${asset.name}" | Description: "${asset.description}"`)
      console.log(`   NEW - Name: "${asset.description}" | Serial: "${asset.name}" | Description: "${asset.name} - ${asset.description}"`)
      console.log('')
    })

    if (dryRun) {
      console.log('🚨 This is a DRY RUN - no changes will be made')
      console.log('💡 Run with dryRun=false to execute the changes')
      return
    }

    console.log('⚠️  EXECUTING CHANGES - This will modify your database!')
    
    let successCount = 0
    let errorCount = 0

    // Process assets in batches
    const batchSize = 50
    for (let i = 0; i < assetsToFix.length; i += batchSize) {
      const batch = assetsToFix.slice(i, i + batchSize)
      
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(assetsToFix.length/batchSize)} (${batch.length} assets)`)
      
      for (const asset of batch) {
        try {
          await prisma.asset.update({
            where: { id: asset.id },
            data: {
              name: asset.description, // Move description to name
              serialNumber: asset.serialNumber || asset.name, // Use existing serial or move old name to serial
              description: `${asset.name} - ${asset.description}` // Combine old data for reference
            }
          })
          successCount++
          
          if (successCount % 10 === 0) {
            console.log(`   ✅ Updated ${successCount} assets...`)
          }
        } catch (error) {
          console.error(`   ❌ Error updating asset ${asset.id}:`, error)
          errorCount++
        }
      }
    }

    console.log(`\n🎉 Completed!`)
    console.log(`   ✅ Successfully updated: ${successCount} assets`)
    console.log(`   ❌ Errors: ${errorCount} assets`)

    if (errorCount > 0) {
      console.log(`\n⚠️  There were ${errorCount} errors. Please check the logs above.`)
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
  fixAssetNames(isDryRun)
}

export { fixAssetNames }