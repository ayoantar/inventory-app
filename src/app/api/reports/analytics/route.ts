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

    // Get focused asset statistics
    const [
      totalAssets,
      assetsByCategory,
      assetsByStatus,
      totalValue,
      recentTransactions,
      overdueAssets
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

      // Total asset value
      prisma.asset.aggregate({
        _sum: { currentValue: true }
      }),

      // Recent transactions (last 7 days)
      prisma.assetTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Overdue assets (checked out with expected return date in the past)
      prisma.assetTransaction.count({
        where: {
          type: 'CHECK_OUT',
          actualReturnDate: null,
          expectedReturnDate: {
            lt: new Date()
          }
        }
      })
    ])

    // Calculate key metrics
    const checkedOutAssets = assetsByStatus.find(s => s.status === 'CHECKED_OUT')?._count.status || 0
    const availableAssets = assetsByStatus.find(s => s.status === 'AVAILABLE')?._count.status || 0
    const utilizationRate = totalAssets > 0 ? Math.round((checkedOutAssets / totalAssets) * 100) : 0

    // Activity trends (last 7 days) - track checkouts and checkins separately
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    // Get activity trends separately
    const activityTrends = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = new Date(date)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const [checkouts, checkins] = await Promise.all([
          prisma.assetTransaction.count({
            where: {
              type: 'CHECK_OUT',
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          }),
          prisma.assetTransaction.count({
            where: {
              type: 'CHECK_IN',
              createdAt: {
                gte: dayStart,
                lte: dayEnd
              }
            }
          })
        ])

        return {
          date,
          checkouts,
          checkins
        }
      })
    )

    // Get recent transactions separately
    const recentTransactionDetails = await prisma.assetTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        asset: { select: { name: true } }
      }
    })

    const analytics = {
      overview: {
        totalAssets,
        totalValue: totalValue._sum.currentValue || 0,
        checkedOutAssets,
        availableAssets,
        utilizationRate,
        recentTransactions,
        overdueAssets
      },
      assets: {
        byCategory: assetsByCategory.map(item => ({
          category: item.category,
          count: item._count.category,
          label: item.category.toLowerCase().replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        byStatus: assetsByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
          label: item.status.toLowerCase().replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }))
      },
      activity: {
        trends: activityTrends,
        recentTransactions: recentTransactionDetails.map(transaction => ({
          userName: transaction.user?.name || 'Unknown User',
          assetName: transaction.asset.name,
          type: transaction.type,
          date: transaction.createdAt
        }))
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