import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function createSmartDescriptions(dryRun: boolean = true) {
  console.log(`✨ ${dryRun ? 'DRY RUN' : 'EXECUTING'}: Creating smart descriptions from manufacturer/model data...`)
  
  try {
    // Find all assets to apply consistent description format
    const assetsToUpdate = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        manufacturer: true,
        model: true,
        serialNumber: true,
        assetNumber: true
      }
    })

    console.log(`\n📊 Found ${assetsToUpdate.length} assets that could get better descriptions`)

    if (assetsToUpdate.length === 0) {
      console.log('✅ No assets need description updates!')
      return
    }

    // Show examples of what will be created
    console.log(`\n📋 Examples of new descriptions:`)
    console.log('===============================')
    
    let exampleCount = 0
    for (const asset of assetsToUpdate.slice(0, 10)) {
      const manufacturer = asset.manufacturer?.trim()
      const model = asset.model?.trim()
      
      let newDescription = ''
      
      // Create detailed structured description with clear line items
      const parts = []
      
      // Always show Brand line (even if empty for consistency)
      if (manufacturer && manufacturer !== 'NULL') {
        parts.push(`Brand: ${manufacturer}`)
      } else {
        parts.push(`Brand: -`)
      }
      
      // Always show Model line (even if empty for consistency)  
      if (model && model !== 'NULL') {
        parts.push(`Model: ${model}`)
      } else {
        parts.push(`Model: -`)
      }
      
      // Use the dedicated assetNumber field if available
      const assetNumber = asset.assetNumber?.trim() || ''
      
      // Always show Asset # line (even if empty for consistency)
      if (assetNumber) {
        parts.push(`Asset #: ${assetNumber}`)
      } else {
        parts.push(`Asset #: -`)
      }
      
      newDescription = parts.join('\n')
      
      // Show examples of the new format
      if (newDescription) {
        exampleCount++
        console.log(`${exampleCount}. Asset: ${asset.name}`)
        console.log(`   OLD Description: "${asset.description || 'null'}"`)
        console.log(`   NEW Description: "${newDescription}"`)
        console.log(`   Serial: "${asset.serialNumber}"`)
        console.log('')
      }
    }

    if (exampleCount === 0) {
      console.log('   No meaningful improvements can be made with current data.')
      return
    }

    if (dryRun) {
      console.log('🚨 This is a DRY RUN - no changes will be made')
      console.log('💡 Run with --execute to apply the changes')
      return
    }

    console.log('⚠️  EXECUTING CHANGES...')
    
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const asset of assetsToUpdate) {
      try {
        const manufacturer = asset.manufacturer?.trim()
        const model = asset.model?.trim()
        
        let newDescription = ''
        
        // Create smart description
        if (manufacturer && model && manufacturer !== 'NULL' && model !== 'NULL') {
          newDescription = `${manufacturer} ${model}`
        } else if (manufacturer && manufacturer !== 'NULL') {
          newDescription = manufacturer
        } else if (model && model !== 'NULL') {
          newDescription = model
        }
        
        // Update all assets to ensure consistent format
        if (newDescription) {
          await prisma.asset.update({
            where: { id: asset.id },
            data: {
              description: newDescription
            }
          })
          successCount++
          
          if (successCount % 50 === 0) {
            console.log(`   ✅ Updated ${successCount} descriptions...`)
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
    console.log(`   ✅ Successfully updated: ${successCount} descriptions`)
    console.log(`   ⏭️  Skipped (no improvement): ${skippedCount} descriptions`)
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
  createSmartDescriptions(isDryRun)
}

export { createSmartDescriptions }