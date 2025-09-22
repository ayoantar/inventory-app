import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/asset-groups/[id] - Get specific asset group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const group = await prisma.assetGroup.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        members: {
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                status: true,
                condition: true,
                location: true,
                imageUrl: true,
                manufacturer: true,
                model: true,
                serialNumber: true,
                purchasePrice: true,
                currentValue: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Asset group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to fetch asset group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset group' },
      { status: 500 }
    )
  }
}

// PUT /api/asset-groups/[id] - Update asset group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, category, location, notes, isActive, assetIds } = body

    // Check if group exists
    const existingGroup = await prisma.assetGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Asset group not found' }, { status: 404 })
    }

    // Check if name is being changed to an existing name
    if (name && name !== existingGroup.name) {
      const nameExists = await prisma.assetGroup.findFirst({
        where: { 
          name,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 })
      }
    }

    // Update group and members in transaction
    const updatedGroup = await prisma.$transaction(async (tx) => {
      // Update group details
      const group = await tx.assetGroup.update({
        where: { id },
        data: {
          ...(name && { name }),
          description: description !== undefined ? description : undefined,
          category: category !== undefined ? category : undefined,
          location: location !== undefined ? location : undefined,
          notes: notes !== undefined ? notes : undefined,
          isActive: isActive !== undefined ? isActive : undefined
        }
      })

      // Update members if provided
      if (assetIds !== undefined) {
        // Remove existing members
        await tx.assetGroupMember.deleteMany({
          where: { groupId: id }
        })

        // Add new members
        if (assetIds.length > 0) {
          await tx.assetGroupMember.createMany({
            data: assetIds.map((assetId: string) => ({
              groupId: id,
              assetId,
              quantity: 1
            }))
          })
        }
      }

      return group
    })

    // Fetch complete updated data
    const completeGroup = await prisma.assetGroup.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        members: {
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                status: true,
                condition: true,
                location: true,
                imageUrl: true,
                manufacturer: true,
                model: true,
                serialNumber: true,
                purchasePrice: true,
                currentValue: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    return NextResponse.json(completeGroup)
  } catch (error) {
    console.error('Failed to update asset group:', error)
    return NextResponse.json(
      { error: 'Failed to update asset group' },
      { status: 500 }
    )
  }
}

// DELETE /api/asset-groups/[id] - Delete asset group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if group exists
    const existingGroup = await prisma.assetGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Asset group not found' }, { status: 404 })
    }

    // Delete the group (members will be deleted automatically due to cascade)
    await prisma.assetGroup.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Asset group deleted successfully' })
  } catch (error) {
    console.error('Failed to delete asset group:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset group' },
      { status: 500 }
    )
  }
}