import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get distinct values for filter options
    const [categories, statuses, conditions, locations] = await Promise.all([
      prisma.asset.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' }
      }),
      prisma.asset.findMany({
        select: { status: true },
        distinct: ['status'],
        orderBy: { status: 'asc' }
      }),
      prisma.asset.findMany({
        select: { condition: true },
        distinct: ['condition'],
        orderBy: { condition: 'asc' }
      }),
      prisma.asset.findMany({
        select: { location: { select: { name: true } } },
        where: { location: { isNot: null } },
        distinct: ['locationId']
      })
    ])

    return NextResponse.json({
      categories: categories.map(c => c.category).filter(Boolean),
      statuses: statuses.map(s => s.status).filter(Boolean),
      conditions: conditions.map(c => c.condition).filter(Boolean),
      locations: locations.map(l => l.location?.name).filter(Boolean)
    })
  } catch (error) {
    console.error('Filter options fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}