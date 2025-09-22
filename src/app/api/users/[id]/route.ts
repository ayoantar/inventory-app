import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { PasswordUtils } from '@/lib/password-utils'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userRole = (session.user as any).role as UserRole
  
  if (!hasPermission(userRole, PERMISSIONS.USERS_VIEW)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdAssets: true,
            transactions: true,
            maintenanceRecords: true,
            createdAssetGroups: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userRole = (session.user as any).role as UserRole
  
  if (!hasPermission(userRole, PERMISSIONS.USERS_UPDATE)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      email,
      role,
      department,
      isActive,
      password
    } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email is already taken by another user
      if (email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        })
        if (emailExists) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 400 }
          )
        }
      }
    }

    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (department !== undefined) updateData.department = department
    if (isActive !== undefined) updateData.isActive = isActive

    // Handle password update
    if (password) {
      const passwordValidation = PasswordUtils.validatePasswordStrength(password)
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { 
            error: 'Password does not meet security requirements',
            details: passwordValidation.feedback
          },
          { status: 400 }
        )
      }
      updateData.password = await PasswordUtils.hashPassword(password)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userRole = (session.user as any).role as UserRole
  
  if (!hasPermission(userRole, PERMISSIONS.USERS_DELETE)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const { id } = await params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdAssets: true,
            transactions: true,
            maintenanceRecords: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for active checked-out items specifically
    const activeCheckouts = await prisma.assetTransaction.count({
      where: {
        userId: id,
        type: 'CHECK_OUT',
        status: 'ACTIVE'
      }
    })

    // If user has active checkouts, they need to be transferred first
    if (activeCheckouts > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with active checked-out items. Transfer items first.',
          details: {
            assets: existingUser._count.createdAssets,
            transactions: existingUser._count.transactions,
            maintenanceRecords: existingUser._count.maintenanceRecords,
            activeCheckouts: activeCheckouts
          }
        },
        { status: 400 }
      )
    }

    // Prevent deletion of users with created assets or maintenance records
    const hasNonDeletableData = existingUser._count.createdAssets > 0 || 
                               existingUser._count.maintenanceRecords > 0

    if (hasNonDeletableData) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with created assets or maintenance records. Deactivate the user instead.',
          details: {
            assets: existingUser._count.createdAssets,
            transactions: existingUser._count.transactions,
            maintenanceRecords: existingUser._count.maintenanceRecords,
            activeCheckouts: activeCheckouts
          }
        },
        { status: 400 }
      )
    }

    // Prevent deletion of the last admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last active admin user' },
          { status: 400 }
        )
      }
    }

    // Delete user and handle transaction foreign keys
    await prisma.$transaction(async (tx) => {
      // If user has transactions, nullify the userId to preserve transaction history
      if (existingUser._count.transactions > 0) {
        await tx.assetTransaction.updateMany({
          where: { userId: id },
          data: { userId: null }
        })
      }
      
      // Delete the user
      await tx.user.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}