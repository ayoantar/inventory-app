import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTransactionEmailToMultiple } from '@/lib/email-utils'

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
    const { assetId, type, notes, expectedReturnDate, userId } = body

    if (!assetId || !type) {
      return NextResponse.json(
        { error: 'Asset ID and transaction type are required' },
        { status: 400 }
      )
    }

    // For checkout, userId is required (assigned user)
    if (type === 'CHECK_OUT' && !userId) {
      return NextResponse.json(
        { error: 'User assignment is required for checkout' },
        { status: 400 }
      )
    }

    // Get the asset with client relationship
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
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
      // Create the transaction (use userId from request for checkout, session user for check-in)
      const transaction = await tx.assetTransaction.create({
        data: {
          assetId,
          userId: type === 'CHECK_OUT' ? userId : session.user.id,
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
              assetNumber: true,
              currentValue: true,
              purchasePrice: true,
              imageUrl: true,
              category: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
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

    // Send email notifications for checkout
    if (type === 'CHECK_OUT' && result.user) {
      const recipients: string[] = []

      // Add assigned user email
      if (result.user.email) {
        recipients.push(result.user.email)
        console.log(`📧 Adding assigned user email: ${result.user.email}`)
      }

      // Add client email
      if (asset.client?.email) {
        recipients.push(asset.client.email)
        console.log(`📧 Adding client email: ${asset.client.email}`)
      }

      // Send emails if we have recipients
      if (recipients.length > 0) {
        console.log(`📧 Sending checkout emails to ${recipients.length} recipient(s)`)

        const emailResult = await sendTransactionEmailToMultiple({
          transactionType: 'CHECKOUT',
          userName: result.user.name || result.user.email || 'User',
          recipients,
          assets: [{
            id: result.asset.id,
            name: result.asset.name,
            assetNumber: result.asset.assetNumber,
            serialNumber: result.asset.serialNumber,
            category: result.asset.category,
            currentValue: result.asset.currentValue,
            purchasePrice: result.asset.purchasePrice,
            imageUrl: result.asset.imageUrl,
            notes,
            returnDate: expectedReturnDate
          }],
          transactionDate: new Date()
        })

        if (emailResult.success) {
          console.log('✅ Checkout emails sent successfully')
        } else {
          console.error('❌ Error sending checkout emails:', emailResult)
        }
      } else {
        console.log('⚠️ No email recipients found for checkout notification')
      }
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Transaction POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}