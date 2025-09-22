import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
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

    // Check if user has permission to update clients (admin/manager)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, contact, email, phone, address, isActive } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Validate code format (uppercase, alphanumeric, 2-10 chars)
    if (!/^[A-Z0-9]{2,10}$/.test(code.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Client code must be 2-10 alphanumeric characters (letters and/or numbers)' 
      }, { status: 400 })
    }

    const { id } = await params
    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
        description,
        contact,
        email,
        phone,
        address,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        _count: {
          select: {
            assets: true
          }
        }
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Client name or code already exists' 
      }, { status: 400 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
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

    // Check if user has permission to delete clients (admin only)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    // Check if client has assets
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client._count.assets > 0) {
      // Instead of deleting, deactivate the client
      const updatedClient = await prisma.client.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({ 
        message: 'Client deactivated due to existing assets',
        client: updatedClient
      })
    }

    // If no assets, can safely delete
    await prisma.client.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}