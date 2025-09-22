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

    // Get asset counts by status
    const assetStats = await prisma.asset.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Get transaction counts
    const activeTransactions = await prisma.assetTransaction.count({
      where: {
        status: 'ACTIVE'
      }
    })

    const overdueTransactions = await prisma.assetTransaction.count({
      where: {
        status: 'OVERDUE'
      }
    })

    // Calculate stats
    const totalAssets = assetStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const availableAssets = assetStats.find(stat => stat.status === 'AVAILABLE')?._count.id || 0
    const checkedOutAssets = assetStats.find(stat => stat.status === 'CHECKED_OUT')?._count.id || 0
    const maintenanceAssets = assetStats.find(stat => stat.status === 'IN_MAINTENANCE')?._count.id || 0

    return NextResponse.json({
      totalAssets,
      availableAssets,
      checkedOutAssets,
      maintenanceAssets,
      activeTransactions,
      overdueTransactions
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}