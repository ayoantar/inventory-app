import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AssetCategory } from '../../../generated/prisma'

// GET /api/presets - List all presets
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ]
        } : {},
        category ? { category: { contains: category, mode: 'insensitive' as const } } : {},
        isActive !== null ? { isActive: isActive === 'true' } : {},
      ]
    }

    const [presets, total] = await Promise.all([
      prisma.preset.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' },
          { name: 'asc' }
        ],
        include: {
          createdBy: {
            select: { name: true, email: true }
          },
          items: {
            include: {
              asset: {
                select: { id: true, name: true, description: true, status: true }
              }
            }
          },
          _count: {
            select: {
              items: true,
              checkouts: true
            }
          }
        }
      }),
      prisma.preset.count({ where })
    ])

    return NextResponse.json({
      presets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch presets:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json({
      error: 'Failed to fetch presets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/presets - Create new preset
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      isTemplate,
      notes,
      items
    } = body

    // Validate required fields
    if (!name || !Array.isArray(items)) {
      return NextResponse.json({ 
        error: 'Name and items are required' 
      }, { status: 400 })
    }

    // Create preset with items in a transaction
    const preset = await prisma.$transaction(async (tx) => {
      const newPreset = await tx.preset.create({
        data: {
          name,
          description,
          category,
          isTemplate: isTemplate || false,
          notes,
          createdById: session.user.id,
        }
      })

      // Create preset items
      if (items.length > 0) {
        await tx.presetItem.createMany({
          data: items.map((item: any, index: number) => ({
            presetId: newPreset.id,
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

      return newPreset
    })

    // Fetch the complete preset with relations
    const completePreset = await prisma.preset.findUnique({
      where: { id: preset.id },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            asset: {
              select: { id: true, name: true, description: true, status: true }
            }
          }
        }
      }
    })

    return NextResponse.json(completePreset, { status: 201 })
  } catch (error) {
    console.error('Failed to create preset:', error)
    
    // Provide more detailed error information
    let errorMessage = 'Failed to create preset'
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'Duplicate item detected. Please check your preset items for duplicates.'
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid asset reference. Please check your asset selections.'
      } else {
        errorMessage = `Database error: ${error.message}`
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}