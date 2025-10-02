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
    const type = searchParams.get('type') // 'CHECK_IN', 'CHECK_OUT', or undefined for all
    const status = searchParams.get('status') // 'ACTIVE', 'COMPLETED', etc.

    // Build date filter
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Build where clause
    const where: any = {}
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter
    if (type) where.type = type
    if (status) where.status = status

    const transactions = await prisma.assetTransaction.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            category: true,
            manufacturer: true,
            model: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      transactions,
      summary: {
        total: transactions.length,
        checkOuts: transactions.filter(t => t.type === 'CHECK_OUT').length,
        checkIns: transactions.filter(t => t.type === 'CHECK_IN').length,
        active: transactions.filter(t => t.status === 'ACTIVE').length,
        completed: transactions.filter(t => t.status === 'COMPLETED').length
      }
    })

  } catch (error) {
    console.error('Transactions report error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions report' },
      { status: 500 }
    )
  }
}