import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Finding assets with undefined in asset numbers...')

  // Find all assets with "undefined" in their asset number
  const assetsWithUndefined = await prisma.asset.findMany({
    where: {
      assetNumber: {
        contains: 'undefined'
      }
    },
    include: {
      client: {
        select: { code: true }
      },
      category: {
        select: { id: true, code: true }
      }
    }
  })

  console.log(`Found ${assetsWithUndefined.length} assets with undefined in asset numbers`)

  for (const asset of assetsWithUndefined) {
    const clientCode = asset.client?.code || 'UNKN'
    const categoryCode = asset.category?.code || 'OTH'

    // Extract the sequence number from the old asset number if possible
    const parts = asset.assetNumber?.split('-')
    let sequenceNumber = '0001'

    if (parts && parts.length >= 3 && parts[2] !== 'undefined') {
      sequenceNumber = parts[2]
    } else {
      // Find the highest existing number for this client and category
      const prefix = `${clientCode}-${categoryCode}-`
      const lastAsset = await prisma.asset.findFirst({
        where: {
          assetNumber: {
            startsWith: prefix,
            not: {
              contains: 'undefined'
            }
          }
        },
        orderBy: {
          assetNumber: 'desc'
        }
      })

      if (lastAsset?.assetNumber) {
        const lastParts = lastAsset.assetNumber.split('-')
        if (lastParts.length === 3) {
          const lastNum = parseInt(lastParts[2])
          if (!isNaN(lastNum)) {
            sequenceNumber = (lastNum + 1).toString().padStart(4, '0')
          }
        }
      }
    }

    const newAssetNumber = `${clientCode}-${categoryCode}-${sequenceNumber}`

    // Check if this asset number already exists
    const existing = await prisma.asset.findUnique({
      where: { assetNumber: newAssetNumber }
    })

    if (existing && existing.id !== asset.id) {
      // Find next available number
      let nextNum = parseInt(sequenceNumber) + 1
      let finalAssetNumber = `${clientCode}-${categoryCode}-${nextNum.toString().padStart(4, '0')}`

      while (await prisma.asset.findUnique({ where: { assetNumber: finalAssetNumber } })) {
        nextNum++
        finalAssetNumber = `${clientCode}-${categoryCode}-${nextNum.toString().padStart(4, '0')}`
      }

      console.log(`  ✅ ${asset.assetNumber} → ${finalAssetNumber} (${asset.name})`)

      await prisma.asset.update({
        where: { id: asset.id },
        data: { assetNumber: finalAssetNumber }
      })
    } else {
      console.log(`  ✅ ${asset.assetNumber} → ${newAssetNumber} (${asset.name})`)

      await prisma.asset.update({
        where: { id: asset.id },
        data: { assetNumber: newAssetNumber }
      })
    }
  }

  console.log('✨ Asset number fix complete!')
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
