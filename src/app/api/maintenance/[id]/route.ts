import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MaintenanceStatus } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const maintenanceRecord = await prisma.maintenanceRecord.findUnique({
      where: { id: resolvedParams.id },
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

    if (!maintenanceRecord) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    return NextResponse.json(maintenanceRecord)

  } catch (error) {
    console.error('Maintenance GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance record' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const body = await request.json()
    const {
      status,
      priority,
      performedDate,
      actualCost,
      performedById,
      notes,
      completionNotes
    } = body

    // Verify maintenance record exists
    const existingRecord = await prisma.maintenanceRecord.findUnique({
      where: { id: resolvedParams.id },
      include: {
        asset: true
      }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    // Use transaction to update both maintenance record and asset status
    const updatedRecord = await prisma.$transaction(async (tx) => {
      // Update maintenance record
      const record = await tx.maintenanceRecord.update({
        where: { id: resolvedParams.id },
        data: {
          ...(status && { status: status as MaintenanceStatus }),
          ...(priority && { priority }),
          ...(performedDate && { performedDate: new Date(performedDate) }),
          ...(actualCost !== undefined && { actualCost }),
          ...(performedById && { performedById }),
          ...(notes !== undefined && { notes }),
          ...(completionNotes !== undefined && { completionNotes })
        },
        include: {
          asset: {
            select: { id: true, name: true, serialNumber: true, status: true }
          },
          performedBy: {
            select: { name: true, email: true }
          },
          createdBy: {
            select: { name: true, email: true }
          }
        }
      })

      // If maintenance is completed and asset is currently in maintenance, make it available
      if (status === 'COMPLETED' && existingRecord.asset.status === 'IN_MAINTENANCE') {
        await tx.asset.update({
          where: { id: existingRecord.assetId },
          data: { status: 'AVAILABLE' }
        })
      }

      // If maintenance is scheduled/in_progress and asset is available, set to maintenance
      if ((status === 'SCHEDULED' || status === 'IN_PROGRESS') && existingRecord.asset.status === 'AVAILABLE') {
        await tx.asset.update({
          where: { id: existingRecord.assetId },
          data: { status: 'IN_MAINTENANCE' }
        })
      }

      return record
    })

    return NextResponse.json(updatedRecord)

  } catch (error) {
    console.error('Maintenance PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    
    // Verify maintenance record exists
    const existingRecord = await prisma.maintenanceRecord.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: 'Maintenance record not found' }, { status: 404 })
    }

    await prisma.maintenanceRecord.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: 'Maintenance record deleted successfully' })

  } catch (error) {
    console.error('Maintenance DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance record' },
      { status: 500 }
    )
  }
}