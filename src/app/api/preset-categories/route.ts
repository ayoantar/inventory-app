import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const where = activeOnly ? { isActive: true } : {}

    const categories = await prisma.presetCategory.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Preset categories GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const category = await prisma.presetCategory.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Preset category POST error:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create preset category' },
      { status: 500 }
    )
  }
}
