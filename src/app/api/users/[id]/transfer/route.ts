import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PERMISSIONS, hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userRole = (session.user as any).role as UserRole
  
  if (!hasPermission(userRole, PERMISSIONS.USERS_DELETE)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const { id: fromUserId } = await params
    const body = await request.json()
    const { toUserId } = body

    if (!toUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    // Check if both users exist
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: fromUserId },
        select: { id: true, name: true, email: true }
      }),
      prisma.user.findUnique({
        where: { id: toUserId },
        select: { id: true, name: true, email: true, isActive: true }
      })
    ])

    if (!fromUser) {
      return NextResponse.json(
        { error: 'Source user not found' },
        { status: 404 }
      )
    }

    if (!toUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    if (!toUser.isActive) {
      return NextResponse.json(
        { error: 'Cannot transfer to inactive user' },
        { status: 400 }
      )
    }

    // Get all active transactions for the user (checked out items)
    const activeTransactions = await prisma.assetTransaction.findMany({
      where: {
        userId: fromUserId,
        type: 'CHECK_OUT',
        status: 'ACTIVE'
      },
      include: {
        asset: {
          select: { id: true, name: true, serialNumber: true }
        }
      }
    })

    if (activeTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No active transactions to transfer' },
        { status: 400 }
      )
    }

    // Transfer all active transactions using a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update all active transactions to the new user
      const updatedTransactions = await tx.assetTransaction.updateMany({
        where: {
          userId: fromUserId,
          type: 'CHECK_OUT',
          status: 'ACTIVE'
        },
        data: {
          userId: toUserId
        }
      })

      // Add transfer notes to each transaction individually
      await Promise.all(
        activeTransactions.map(transaction =>
          tx.assetTransaction.update({
            where: { id: transaction.id },
            data: {
              notes: (transaction.notes || '') + ` [Transferred from ${fromUser.name || fromUser.email} on ${new Date().toISOString().split('T')[0]}]`
            }
          })
        )
      )

      return {
        transferredCount: updatedTransactions.count,
        transactions: activeTransactions
      }
    })

    return NextResponse.json({
      message: `Successfully transferred ${result.transferredCount} checked-out items`,
      transferredCount: result.transferredCount,
      fromUser: {
        id: fromUser.id,
        name: fromUser.name,
        email: fromUser.email
      },
      toUser: {
        id: toUser.id,
        name: toUser.name,
        email: toUser.email
      },
      transferredAssets: result.transactions.map(t => ({
        id: t.asset.id,
        name: t.asset.name,
        serialNumber: t.asset.serialNumber
      }))
    })

  } catch (error) {
    console.error('Error transferring user transactions:', error)
    return NextResponse.json(
      { error: 'Failed to transfer transactions' },
      { status: 500 }
    )
  }
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
    const { id: userId } = await params

    // Get active transactions for the user
    const activeTransactions = await prisma.assetTransaction.findMany({
      where: {
        userId,
        type: 'CHECK_OUT',
        status: 'ACTIVE'
      },
      include: {
        asset: {
          select: { 
            id: true, 
            name: true, 
            serialNumber: true,
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      activeTransactions,
      count: activeTransactions.length
    })

  } catch (error) {
    console.error('Error fetching user transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}