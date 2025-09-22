import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') // Optional: filter by specific client

    // Get all clients with their assets
    const whereClause: any = { isActive: true }
    if (clientId) whereClause.id = clientId

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        assets: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            category: true,
            status: true,
            condition: true,
            manufacturer: true,
            model: true,
            location: true,
            purchasePrice: true,
            currentValue: true,
            purchaseDate: true,
            createdAt: true
          },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate summary statistics
    const summary = {
      totalClients: clients.length,
      totalAssets: clients.reduce((sum, client) => sum + client.assets.length, 0),
      totalValue: clients.reduce((sum, client) => 
        sum + client.assets.reduce((assetSum, asset) => 
          assetSum + (asset.currentValue || 0), 0), 0),
      totalPurchaseValue: clients.reduce((sum, client) => 
        sum + client.assets.reduce((assetSum, asset) => 
          assetSum + (asset.purchasePrice || 0), 0), 0),
      statusBreakdown: {
        available: 0,
        checkedOut: 0,
        inMaintenance: 0,
        retired: 0
      }
    }

    // Calculate status breakdown
    clients.forEach(client => {
      client.assets.forEach(asset => {
        switch (asset.status) {
          case 'AVAILABLE':
            summary.statusBreakdown.available++
            break
          case 'CHECKED_OUT':
            summary.statusBreakdown.checkedOut++
            break
          case 'IN_MAINTENANCE':
            summary.statusBreakdown.inMaintenance++
            break
          case 'RETIRED':
            summary.statusBreakdown.retired++
            break
        }
      })
    })

    // Add client-specific statistics
    const clientsWithStats = clients.map(client => ({
      ...client,
      stats: {
        totalAssets: client.assets.length,
        totalValue: client.assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0),
        totalPurchaseValue: client.assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
        categoryBreakdown: client.assets.reduce((breakdown: any, asset) => {
          breakdown[asset.category] = (breakdown[asset.category] || 0) + 1
          return breakdown
        }, {}),
        statusBreakdown: client.assets.reduce((breakdown: any, asset) => {
          breakdown[asset.status] = (breakdown[asset.status] || 0) + 1
          return breakdown
        }, {})
      }
    }))

    return NextResponse.json({
      clients: clientsWithStats,
      summary
    })

  } catch (error) {
    console.error('Client assets report error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client assets report' },
      { status: 500 }
    )
  }
}