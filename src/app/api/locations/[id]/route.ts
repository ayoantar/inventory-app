import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        assets: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
            imageUrl: true
          },
          orderBy: { name: 'asc' }
        },
        assetGroups: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                members: true
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: {
            assets: true,
            assetGroups: true,
            assetTransactions: true
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Check if user has permission to edit locations (admin/manager)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, building, floor, room, description, capacity, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        building,
        floor,
        room,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        isActive: isActive !== undefined ? isActive : undefined
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error updating location:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Location name already exists' }, { status: 400 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Check if user has permission to delete locations (admin only)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    // Check if location has any assets or asset groups
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true,
            assetGroups: true,
            assetTransactions: true
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    if (location._count.assets > 0 || location._count.assetGroups > 0 || location._count.assetTransactions > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete location with associated assets, groups, or transactions' 
      }, { status: 400 })
    }

    await prisma.location.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Error deleting location:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}