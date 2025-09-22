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
    const status = searchParams.get('status') // 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', etc.
    const type = searchParams.get('type') // 'PREVENTIVE', 'CORRECTIVE', etc.

    // Build date filter (use scheduledDate for maintenance)
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Build where clause
    const where: any = {}
    if (Object.keys(dateFilter).length > 0) where.scheduledDate = dateFilter
    if (status) where.status = status
    if (type) where.type = type

    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            category: true,
            manufacturer: true,
            model: true,
            location: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    })

    // Calculate total costs
    const totalEstimatedCost = maintenanceRecords.reduce((sum, record) => 
      sum + (record.cost || 0), 0
    )
    const totalActualCost = maintenanceRecords.reduce((sum, record) => 
      sum + (record.actualCost || 0), 0
    )

    return NextResponse.json({
      maintenanceRecords,
      summary: {
        total: maintenanceRecords.length,
        scheduled: maintenanceRecords.filter(r => r.status === 'SCHEDULED').length,
        inProgress: maintenanceRecords.filter(r => r.status === 'IN_PROGRESS').length,
        completed: maintenanceRecords.filter(r => r.status === 'COMPLETED').length,
        overdue: maintenanceRecords.filter(r => 
          r.status === 'SCHEDULED' && new Date(r.scheduledDate) < new Date()
        ).length,
        totalEstimatedCost,
        totalActualCost,
        costVariance: totalActualCost - totalEstimatedCost
      }
    })

  } catch (error) {
    console.error('Maintenance report error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance report' },
      { status: 500 }
    )
  }
}