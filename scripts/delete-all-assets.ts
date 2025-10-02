import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function deleteAllAssets() {
  try {
    console.log('Starting asset deletion process...')

    // Count assets before deletion
    const assetCount = await prisma.asset.count()
    console.log(`Found ${assetCount} assets to delete`)

    if (assetCount === 0) {
      console.log('No assets to delete')
      return
    }

    // Delete all assets (cascade will handle related records)
    const result = await prisma.asset.deleteMany({})

    console.log(`Successfully deleted ${result.count} assets`)

    // Verify deletion
    const remainingAssets = await prisma.asset.count()
    console.log(`Remaining assets: ${remainingAssets}`)

    if (remainingAssets === 0) {
      console.log('✅ All assets deleted successfully!')
    } else {
      console.log('⚠️ Warning: Some assets may still remain')
    }

  } catch (error) {
    console.error('Error deleting assets:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllAssets()
  .then(() => {
    console.log('Asset deletion completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to delete assets:', error)
    process.exit(1)
  })
