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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 30 days if no date range provided
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)
    
    const dateFilter = {
      gte: startDate ? new Date(startDate) : defaultStartDate,
      lte: endDate ? new Date(endDate) : new Date()
    }

    // Get asset statistics
    const [
      totalAssets,
      assetsByCategory,
      assetsByStatus,
      assetsByCondition,
      totalValue,
      recentTransactions,
      maintenanceStats,
      checkoutStats,
      topUsers,
      categoryValues
    ] = await Promise.all([
      // Total assets count
      prisma.asset.count(),

      // Assets by category
      prisma.asset.groupBy({
        by: ['category'],
        _count: { category: true }
      }),

      // Assets by status
      prisma.asset.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Assets by condition
      prisma.asset.groupBy({
        by: ['condition'],
        _count: { condition: true }
      }),

      // Total asset value
      prisma.asset.aggregate({
        _sum: { currentValue: true, purchasePrice: true }
      }),

      // Recent transactions
      prisma.assetTransaction.count({
        where: {
          createdAt: dateFilter
        }
      }),

      // Maintenance statistics
      prisma.maintenanceRecord.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { cost: true }
      }),

      // Checkout statistics
      prisma.assetTransaction.groupBy({
        by: ['type'],
        _count: { type: true },
        where: {
          createdAt: dateFilter
        }
      }),

      // Most active users
      prisma.assetTransaction.groupBy({
        by: ['userId'],
        _count: { userId: true },
        where: {
          createdAt: dateFilter,
          userId: { not: null }
        },
        orderBy: {
          _count: { userId: 'desc' }
        },
        take: 5
      }),

      // Asset values by category
      prisma.asset.groupBy({
        by: ['category'],
        _sum: { currentValue: true, purchasePrice: true },
        _count: { category: true }
      })
    ])

    // Get user details for top users (filter out null userIds)
    const userIds = topUsers.map(u => u.userId).filter(id => id !== null)
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    }) : []

    const topUsersWithDetails = topUsers.map(stat => ({
      ...stat,
      user: users.find(u => u.id === stat.userId)
    }))

    // Calculate utilization rate (checked out assets / total assets)
    const checkedOutAssets = assetsByStatus.find(s => s.status === 'CHECKED_OUT')?._count.status || 0
    const utilizationRate = totalAssets > 0 ? (checkedOutAssets / totalAssets) * 100 : 0

    // Calculate maintenance cost efficiency
    const totalMaintenanceCost = maintenanceStats.reduce((sum, stat) => 
      sum + (stat._sum.cost || 0), 0
    )
    const maintenanceCostPerAsset = totalAssets > 0 ? totalMaintenanceCost / totalAssets : 0

    // Recent activity trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const activityTrends = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = new Date(date)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const transactions = await prisma.assetTransaction.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        })

        return {
          date,
          transactions
        }
      })
    )

    const analytics = {
      overview: {
        totalAssets,
        totalValue: totalValue._sum.currentValue || 0,
        totalPurchaseValue: totalValue._sum.purchasePrice || 0,
        recentTransactions,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        maintenanceCostPerAsset: Math.round(maintenanceCostPerAsset * 100) / 100
      },
      assets: {
        byCategory: assetsByCategory.map(item => ({
          category: item.category,
          count: item._count.category,
          label: item.category.toLowerCase().replace('_', ' ')
        })),
        byStatus: assetsByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
          label: item.status.toLowerCase().replace('_', ' ')
        })),
        byCondition: assetsByCondition.map(item => ({
          condition: item.condition,
          count: item._count.condition,
          label: item.condition.toLowerCase().replace('_', ' ')
        }))
      },
      financial: {
        categoryValues: categoryValues.map(item => ({
          category: item.category,
          currentValue: item._sum.currentValue || 0,
          purchaseValue: item._sum.purchasePrice || 0,
          count: item._count.category,
          label: item.category.toLowerCase().replace('_', ' ')
        })),
        totalCurrentValue: totalValue._sum.currentValue || 0,
        totalPurchaseValue: totalValue._sum.purchasePrice || 0,
        depreciation: ((totalValue._sum.purchasePrice || 0) - (totalValue._sum.currentValue || 0))
      },
      maintenance: {
        byStatus: maintenanceStats.map(item => ({
          status: item.status,
          count: item._count.status,
          cost: item._sum.cost || 0,
          label: item.status.toLowerCase().replace('_', ' ')
        })),
        totalCost: totalMaintenanceCost,
        averageCostPerAsset: maintenanceCostPerAsset
      },
      activity: {
        transactions: checkoutStats.map(item => ({
          type: item.type,
          count: item._count.type,
          label: item.type.toLowerCase().replace('_', ' ')
        })),
        topUsers: topUsersWithDetails.map(item => ({
          userId: item.userId,
          transactionCount: item._count.userId,
          userName: item.user?.name || 'Unknown User',
          userEmail: item.user?.email
        })),
        trends: activityTrends
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}