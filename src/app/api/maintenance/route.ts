import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MaintenanceType, MaintenanceStatus } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

    if (assetId) {
      where.assetId = assetId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { asset: { name: { contains: search, mode: 'insensitive' } } },
        { asset: { serialNumber: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [maintenanceRecords, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          asset: {
            select: { id: true, name: true, serialNumber: true }
          },
          performedBy: {
            select: { name: true, email: true }
          },
          createdBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.maintenanceRecord.count({ where })
    ])

    return NextResponse.json({
      maintenanceRecords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Maintenance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      assetId,
      type,
      description,
      scheduledDate,
      estimatedCost,
      priority,
      notes
    } = body

    // Validate required fields
    if (!assetId || !type || !description) {
      return NextResponse.json(
        { error: 'Asset ID, type, and description are required' },
        { status: 400 }
      )
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        assetId,
        type: type as MaintenanceType,
        description,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        cost: estimatedCost || null,
        priority: priority || 'MEDIUM',
        notes,
        status: 'SCHEDULED' as MaintenanceStatus,
        createdById: session.user.id
      },
      include: {
        asset: {
          select: { id: true, name: true, serialNumber: true }
        },
        performedBy: {
          select: { name: true, email: true }
        },
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(maintenanceRecord, { status: 201 })

  } catch (error) {
    console.error('Maintenance POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}