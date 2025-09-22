import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAssetNumber } from '@/lib/asset-number-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all assets without asset numbers
    const assetsWithoutNumbers = await prisma.asset.findMany({
      where: {
        OR: [
          { assetNumber: null },
          { assetNumber: '' }
        ]
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    console.log(`Found ${assetsWithoutNumbers.length} assets without asset numbers`)

    if (assetsWithoutNumbers.length === 0) {
      return NextResponse.json({ 
        message: 'No assets found without asset numbers',
        updated: 0
      })
    }

    // Update assets in batches to avoid overwhelming the database
    const batchSize = 50
    let totalUpdated = 0
    const errors = []

    for (let i = 0; i < assetsWithoutNumbers.length; i += batchSize) {
      const batch = assetsWithoutNumbers.slice(i, i + batchSize)
      
      for (const asset of batch) {
        try {
          // Generate a unique asset number for this asset
          const assetNumber = await generateAssetNumber(asset.category, asset.clientId)
          
          await prisma.asset.update({
            where: { id: asset.id },
            data: { 
              assetNumber,
              lastModifiedById: session.user.id
            }
          })
          
          totalUpdated++
          console.log(`Assigned ${assetNumber} to asset "${asset.name}" (${asset.id})`)
          
        } catch (error) {
          console.error(`Failed to assign asset number to ${asset.name}:`, error)
          errors.push(`${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < assetsWithoutNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const response = {
      message: `Successfully assigned asset numbers to ${totalUpdated} assets`,
      updated: totalUpdated,
      total: assetsWithoutNumbers.length,
      errors: errors.length > 0 ? errors : undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Bulk assign asset numbers error:', error)
    return NextResponse.json({ 
      error: `Failed to bulk assign asset numbers: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// GET endpoint to check how many assets need asset numbers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const count = await prisma.asset.count({
      where: {
        OR: [
          { assetNumber: null },
          { assetNumber: '' }
        ]
      }
    })

    const breakdown = await prisma.asset.groupBy({
      by: ['category'],
      where: {
        OR: [
          { assetNumber: null },
          { assetNumber: '' }
        ]
      },
      _count: {
        id: true
      },
      orderBy: {
        category: 'asc'
      }
    })

    return NextResponse.json({
      totalWithoutNumbers: count,
      breakdown: breakdown.map(item => ({
        category: item.category,
        count: item._count.id
      }))
    })

  } catch (error) {
    console.error('Get asset count error:', error)
    return NextResponse.json({ 
      error: `Failed to get asset count: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}