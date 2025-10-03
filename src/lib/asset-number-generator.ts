import { prisma } from './prisma'

/**
 * Generates a unique asset number in the format [ClientCode]-[AssetType]-[Serial]
 * Example: LSVR-CAM-0001, ACME-LIT-0023
 */
export async function generateAssetNumber(clientCode: string, categoryId: string): Promise<string> {
  // Fetch the category code from the database
  const category = await prisma.customCategory.findUnique({
    where: { id: categoryId },
    select: { code: true }
  })

  const assetTypeCode = category?.code || 'OTH'
  const prefix = `${clientCode}-${assetTypeCode}-`
  
  // Find the highest existing asset number for this client and category
  const lastAsset = await prisma.asset.findFirst({
    where: {
      assetNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      assetNumber: 'desc'
    }
  })
  
  let nextNumber = 1
  
  if (lastAsset?.assetNumber) {
    // Extract the numeric part from the asset number
    const parts = lastAsset.assetNumber.split('-')
    if (parts.length === 3) {
      const numericPart = parseInt(parts[2])
      if (!isNaN(numericPart)) {
        nextNumber = numericPart + 1
      }
    }
  }
  
  // Format the number with leading zeros (4 digits)
  const formattedNumber = nextNumber.toString().padStart(4, '0')
  
  return `${prefix}${formattedNumber}`
}

/**
 * Validates that an asset number follows the expected format [ClientCode]-[AssetType]-[Serial]
 */
export function validateAssetNumber(assetNumber: string): boolean {
  const pattern = /^[A-Z0-9]{2,10}-[A-Z]{3}-\d{4}$/
  return pattern.test(assetNumber)
}

/**
 * Gets the asset type code for a category ID from the database
 */
export async function getAssetTypeCode(categoryId: string): Promise<string> {
  const category = await prisma.customCategory.findUnique({
    where: { id: categoryId },
    select: { code: true }
  })
  return category?.code || 'OTH'
}