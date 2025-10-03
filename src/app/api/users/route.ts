import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PasswordUtils } from '@/lib/password-utils'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👥 Users GET API called by user:', session.user.id)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    if (active !== null && active !== undefined) {
      where.isActive = active === 'true'
    }

    // Check if user is admin - admins get full details, others get basic info only
    const isAdmin = (session.user as any).role === 'ADMIN'

    // Build select object based on role
    const selectFields: any = {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    }

    // Add admin-only fields
    if (isAdmin) {
      selectFields.department = true
      selectFields.lastLoginAt = true
      selectFields.createdAt = true
      selectFields.updatedAt = true
      selectFields._count = {
        select: {
          createdAssets: true,
          transactions: true,
          maintenanceRecords: true
        }
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    console.log('✅ Users fetched successfully:', { total, returned: users.length, isAdmin })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('❌ Users GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
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

    // Check if user is admin - only admins can create users
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Only admins can create users.' }, { status: 403 })
    }

    console.log('👥 User creation API called by admin:', session.user.id)

    const body = await request.json()
    const {
      name,
      email,
      password,
      role,
      department,
      isActive = true
    } = body

    console.log('📝 Creating user with data:', { name, email, role, department, isActive })

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Validate password strength
    console.log('🔐 Validating password strength...')
    const passwordValidation = PasswordUtils.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      console.log('❌ Password validation failed:', passwordValidation.feedback)
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          details: passwordValidation.feedback
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('👀 Checking if user exists...')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('❌ User already exists with email:', email)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    console.log('🔑 Hashing password...')
    const hashedPassword = await PasswordUtils.hashPassword(password)

    // Create user
    console.log('➕ Creating user in database...')
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ User created successfully:', user.id)
    return NextResponse.json(user, { status: 201 })

  } catch (error) {
    console.error('❌ User creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}