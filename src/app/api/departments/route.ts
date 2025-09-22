import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or manager
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('🏢 Departments GET API called by:', userRole, session.user.id)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const active = searchParams.get('active')
    const includeUsers = searchParams.get('includeUsers') === 'true'

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { manager: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (active !== null && active !== undefined) {
      where.isActive = active === 'true'
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        users: includeUsers ? {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        } : false,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log('✅ Departments fetched successfully:', departments.length)

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('❌ Departments GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or manager
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('🏢 Department creation API called by:', userRole, session.user.id)

    const body = await request.json()
    const {
      name,
      description,
      manager,
      isActive = true
    } = body

    console.log('📝 Creating department with data:', { name, description, manager, isActive })

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check if department already exists
    console.log('👀 Checking if department exists...')
    const existingDepartment = await prisma.department.findUnique({
      where: { name }
    })

    if (existingDepartment) {
      console.log('❌ Department already exists with name:', name)
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      )
    }

    // Create department
    console.log('➕ Creating department in database...')
    const department = await prisma.department.create({
      data: {
        name,
        description,
        manager,
        isActive
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    console.log('✅ Department created successfully:', department.id)
    return NextResponse.json(department, { status: 201 })

  } catch (error) {
    console.error('❌ Department creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}