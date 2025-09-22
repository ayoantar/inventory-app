import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const limit = parseInt(searchParams.get('limit') || '20')
    const assetId = searchParams.get('assetId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const skip = (page - 1) * limit

    const where: any = {}
    if (assetId) where.assetId = assetId
    if (status) where.status = status
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      prisma.assetTransaction.findMany({
        where,
        include: {
          asset: {
            select: { 
              id: true, 
              name: true, 
              serialNumber: true,
              category: true,
              status: true 
            }
          },
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.assetTransaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { assetId, type, notes, expectedReturnDate } = body

    if (!assetId || !type) {
      return NextResponse.json(
        { error: 'Asset ID and transaction type are required' },
        { status: 400 }
      )
    }

    // Get the asset
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Check if asset has active checkout transaction
    if (type === 'CHECK_OUT') {
      const activeTransaction = await prisma.assetTransaction.findFirst({
        where: {
          assetId,
          type: 'CHECK_OUT',
          status: 'ACTIVE'
        }
      })

      if (activeTransaction) {
        return NextResponse.json(
          { error: 'Asset is already checked out' },
          { status: 400 }
        )
      }
    }

    // For check-in, find the active checkout transaction
    if (type === 'CHECK_IN') {
      const activeTransaction = await prisma.assetTransaction.findFirst({
        where: {
          assetId,
          type: 'CHECK_OUT',
          status: 'ACTIVE'
        }
      })

      if (!activeTransaction) {
        return NextResponse.json(
          { error: 'No active checkout found for this asset' },
          { status: 400 }
        )
      }
    }

    // Create transaction and update asset status
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.assetTransaction.create({
        data: {
          assetId,
          userId: session.user.id,
          type,
          status: 'ACTIVE',
          notes,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null
        },
        include: {
          asset: {
            select: { 
              id: true, 
              name: true, 
              serialNumber: true,
              category: true 
            }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      })

      // Update asset status based on transaction type
      let newAssetStatus = asset.status
      if (type === 'CHECK_OUT') {
        newAssetStatus = 'CHECKED_OUT'
      } else if (type === 'CHECK_IN') {
        newAssetStatus = 'AVAILABLE'
        
        // Complete the active checkout transaction
        await tx.assetTransaction.updateMany({
          where: {
            assetId,
            type: 'CHECK_OUT',
            status: 'ACTIVE'
          },
          data: {
            status: 'COMPLETED',
            actualReturnDate: new Date()
          }
        })
      }

      // Update asset status and last modified info
      await tx.asset.update({
        where: { id: assetId },
        data: {
          status: newAssetStatus,
          lastModifiedById: session.user.id
        }
      })

      return transaction
    })

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Transaction POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}