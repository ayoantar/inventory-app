import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AssetStatus } from '../../../../../generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, assetIds, data } = body

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: 'Asset IDs are required' },
        { status: 400 }
      )
    }

    // Verify all assets exist and user has access
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, name: true, status: true }
    })

    if (assets.length !== assetIds.length) {
      return NextResponse.json(
        { error: 'Some assets not found' },
        { status: 404 }
      )
    }

    let result
    
    switch (action) {
      case 'changeStatus':
        if (!data?.status || !Object.values(AssetStatus).includes(data.status)) {
          return NextResponse.json(
            { error: 'Valid status is required' },
            { status: 400 }
          )
        }

        result = await prisma.asset.updateMany({
          where: { id: { in: assetIds } },
          data: {
            status: data.status,
            lastModifiedById: session.user.id
          }
        })

        return NextResponse.json({
          success: true,
          message: `Updated ${result.count} assets to ${data.status}`,
          affectedCount: result.count
        })

      case 'delete':
        // Check for active transactions before deleting
        const assetsWithTransactions = await prisma.asset.findMany({
          where: {
            id: { in: assetIds },
            transactions: {
              some: {
                status: 'ACTIVE'
              }
            }
          },
          select: { id: true, name: true }
        })

        if (assetsWithTransactions.length > 0) {
          return NextResponse.json(
            { 
              error: 'Cannot delete assets with active transactions',
              details: assetsWithTransactions.map(a => a.name)
            },
            { status: 400 }
          )
        }

        // Delete in transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
          // Delete related transactions first
          await tx.assetTransaction.deleteMany({
            where: { assetId: { in: assetIds } }
          })

          // Delete maintenance records
          await tx.maintenanceRecord.deleteMany({
            where: { assetId: { in: assetIds } }
          })

          // Delete assets
          await tx.asset.deleteMany({
            where: { id: { in: assetIds } }
          })
        })

        return NextResponse.json({
          success: true,
          message: `Deleted ${assets.length} assets`,
          affectedCount: assets.length
        })

      case 'export':
        // Get detailed asset data for export
        const exportAssets = await prisma.asset.findMany({
          where: { id: { in: assetIds } },
          include: {
            createdBy: { select: { name: true, email: true } },
            lastModifiedBy: { select: { name: true, email: true } },
            _count: { select: { transactions: true } }
          }
        })

        // Convert to CSV format
        const headers = [
          'Name', 'Description', 'Category', 'Status', 'Condition',
          'Manufacturer', 'Model', 'Serial Number', 'Barcode',
          'Location', 'Purchase Date', 'Purchase Price', 'Current Value',
          'Created By', 'Created Date', 'Last Modified By', 'Last Modified Date',
          'Transaction Count', 'Notes'
        ]

        const csvRows = [
          headers.join(','),
          ...exportAssets.map(asset => [
            `"${asset.name || ''}"`,
            `"${asset.description || ''}"`,
            asset.category,
            asset.status,
            asset.condition,
            `"${asset.manufacturer || ''}"`,
            `"${asset.model || ''}"`,
            `"${asset.serialNumber || ''}"`,
            `"${asset.barcode || ''}"`,
            `"${asset.location || ''}"`,
            asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : '',
            asset.purchasePrice || '',
            asset.currentValue || '',
            `"${asset.createdBy?.name || ''}"`,
            asset.createdAt.toISOString().split('T')[0],
            `"${asset.lastModifiedBy?.name || ''}"`,
            asset.updatedAt.toISOString().split('T')[0],
            asset._count.transactions,
            `"${asset.notes || ''}"`
          ].join(','))
        ]

        const csvContent = csvRows.join('\n')
        const timestamp = new Date().toISOString().split('T')[0]
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="assets-export-${timestamp}.csv"`
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

