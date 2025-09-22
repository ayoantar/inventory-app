import { prisma } from './prisma'
import { AssetCategory } from '../../generated/prisma'

/**
 * Maps asset categories to short type codes
 */
const ASSET_TYPE_CODES: Record<AssetCategory, string> = {
  CAMERA: 'CAM',
  LENS: 'LEN',
  LIGHTING: 'LIT',
  AUDIO: 'AUD',
  COMPUTER: 'COM',
  STORAGE: 'STO',
  ACCESSORY: 'ACC',
  FURNITURE: 'FUR',
  SOFTWARE: 'SOF',
  INFORMATION_TECHNOLOGY: 'ITE',
  OTHER: 'OTH'
}

/**
 * Generates a unique asset number in the format [ClientCode]-[AssetType]-[Serial]
 * Example: LSVR-CAM-0001, ACME-LIT-0023
 */
export async function generateAssetNumber(clientCode: string, category: AssetCategory): Promise<string> {
  const assetTypeCode = ASSET_TYPE_CODES[category]
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
 * Gets the asset type code for a category
 */
export function getAssetTypeCode(category: AssetCategory): string {
  return ASSET_TYPE_CODES[category]
}