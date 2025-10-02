import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/presets/[id] - Get specific preset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const preset = await prisma.preset.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { 
            id: true,
            name: true, 
            email: true 
          }
        },
        items: {
          include: {
            asset: {
              select: { 
                id: true, 
                name: true, 
                description: true, 
                status: true,
                assetNumber: true,
                category: true,
                manufacturer: true,
                model: true
              }
            }
          },
          orderBy: [
            { priority: 'asc' },
            { name: 'asc' }
          ]
        },
        checkouts: {
          select: {
            id: true,
            status: true,
            checkoutDate: true,
            expectedReturnDate: true,
            actualReturnDate: true,
            completionPercent: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { checkoutDate: 'desc' },
          take: 10 // Latest 10 checkouts
        },
        _count: {
          select: {
            items: true,
            checkouts: true,
            substitutions: true
          }
        }
      }
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    return NextResponse.json(preset)
  } catch (error) {
    console.error('Failed to fetch preset:', error)
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 })
  }
}

// PUT /api/presets/[id] - Update preset
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      category,
      isTemplate,
      isActive,
      notes,
      items
    } = body

    // Check if preset exists and user has permission to edit
    const existingPreset = await prisma.preset.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true } }
      }
    })

    if (!existingPreset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Check permissions - creator or admin/manager can edit
    const userRole = (session.user as any).role
    const isOwner = existingPreset.createdBy.id === session.user.id
    const canEdit = isOwner || userRole === 'ADMIN' || userRole === 'MANAGER'

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this preset' }, { status: 403 })
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Update preset with items in a transaction
    const updatedPreset = await prisma.$transaction(async (tx) => {
      // Update preset basic info
      const preset = await tx.preset.update({
        where: { id },
        data: {
          name,
          description,
          category,
          isTemplate: isTemplate || false,
          isActive: isActive !== false, // Default to true unless explicitly false
          notes,
        }
      })

      // If items are provided, update them
      if (Array.isArray(items)) {
        // Delete existing items
        await tx.presetItem.deleteMany({
          where: { presetId: id }
        })

        // Create new items
        if (items.length > 0) {
          await tx.presetItem.createMany({
            data: items.map((item: any, index: number) => ({
              presetId: id,
              assetId: item.assetId || null,
              category: item.category || null,
              name: item.name,
              quantity: item.quantity || 1,
              isRequired: item.isRequired !== false,
              priority: item.priority || index,
              notes: item.notes,
            }))
          })
        }
      }

      return preset
    })

    // Fetch the complete updated preset
    const completePreset = await prisma.preset.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            asset: {
              select: { 
                id: true, 
                name: true, 
                description: true, 
                status: true,
                assetNumber: true,
                category: true
              }
            }
          },
          orderBy: [
            { priority: 'asc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: {
            items: true,
            checkouts: true
          }
        }
      }
    })

    return NextResponse.json(completePreset)
  } catch (error) {
    console.error('Failed to update preset:', error)
    
    let errorMessage = 'Failed to update preset'
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'A preset with this name already exists'
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid asset reference in preset items'
      } else {
        errorMessage = `Database error: ${error.message}`
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/presets/[id] - Delete preset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if preset exists and user has permission to delete
    const existingPreset = await prisma.preset.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true } },
        checkouts: {
          where: {
            status: {
              in: ['IN_PROGRESS', 'PARTIAL']
            }
          }
        },
        _count: {
          select: {
            checkouts: true,
            items: true
          }
        }
      }
    })

    if (!existingPreset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Check permissions - creator or admin can delete
    const userRole = (session.user as any).role
    const isOwner = existingPreset.createdBy.id === session.user.id
    const canDelete = isOwner || userRole === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this preset' }, { status: 403 })
    }

    // Check if preset has active checkouts
    if (existingPreset.checkouts.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete preset. It has ${existingPreset.checkouts.length} active checkout(s).` 
      }, { status: 400 })
    }

    // Delete preset and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete preset checkout items (if any completed checkouts exist)
      await tx.presetCheckoutItem.deleteMany({
        where: {
          presetCheckout: {
            presetId: id
          }
        }
      })

      // Delete preset checkouts
      await tx.presetCheckout.deleteMany({
        where: { presetId: id }
      })

      // Delete preset substitutions
      await tx.presetSubstitution.deleteMany({
        where: { presetId: id }
      })

      // Delete preset items
      await tx.presetItem.deleteMany({
        where: { presetId: id }
      })

      // Finally, delete the preset
      await tx.preset.delete({
        where: { id }
      })
    })

    return NextResponse.json({ 
      message: 'Preset deleted successfully',
      deletedPreset: {
        id: existingPreset.id,
        name: existingPreset.name
      }
    })
  } catch (error) {
    console.error('Failed to delete preset:', error)
    
    let errorMessage = 'Failed to delete preset'
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Cannot delete preset due to existing references. Please contact support.'
      } else {
        errorMessage = `Database error: ${error.message}`
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}