import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/asset-groups - List all asset groups
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isActive = searchParams.get('active')

    const skip = (page - 1) * limit

    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      whereClause.category = category
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    const [groups, total] = await Promise.all([
      prisma.assetGroup.findMany({
        where: whereClause,
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
                  category: true,
                  status: true,
                  imageUrl: true
                }
              }
            }
          },
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.assetGroup.count({ where: whereClause })
    ])

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }

    return NextResponse.json({ groups, pagination })
  } catch (error) {
    console.error('Failed to fetch asset groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset groups' },
      { status: 500 }
    )
  }
}


// POST /api/asset-groups - Create new asset group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, location, notes, assetIds } = body

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Check if group name already exists
    const existingGroup = await prisma.assetGroup.findFirst({
      where: { name }
    })

    if (existingGroup) {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 400 })
    }

    // Create the group with members in a transaction
    const group = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.assetGroup.create({
        data: {
          name,
          description: description || null,
          category: category || null,
          location: location || null,
          notes: notes || null,
          createdById: session.user.id
        }
      })

      // Add members if provided
      if (assetIds && assetIds.length > 0) {
        await tx.assetGroupMember.createMany({
          data: assetIds.map((assetId: string) => ({
            groupId: newGroup.id,
            assetId,
            quantity: 1
          }))
        })
      }

      return newGroup
    })

    // Fetch the complete group data to return
    const completeGroup = await prisma.assetGroup.findUnique({
      where: { id: group.id },
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
                category: true,
                status: true,
                imageUrl: true
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

    return NextResponse.json(completeGroup, { status: 201 })
  } catch (error) {
    console.error('Failed to create asset group:', error)
    return NextResponse.json(
      { error: 'Failed to create asset group' },
      { status: 500 }
    )
  }
}