import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendTransactionEmail } from '@/lib/email-utils'

const prisma = new PrismaClient()

interface BulkTransactionItem {
  assetId: string
  notes?: string
  expectedReturnDate?: string
  assignedUserId?: string
}

interface BulkTransactionRequest {
  action: 'CHECK_IN' | 'CHECK_OUT'
  items: BulkTransactionItem[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkTransactionRequest = await request.json()
    const { action, items } = body

    if (!action || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    if (items.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 items allowed per batch' }, { status: 400 })
    }

    const results = []
    const errors = []
    let processed = 0
    const processedAssets = [] // Collect assets for email

    // Process each item individually to handle partial failures
    for (const item of items) {
      try {
        await prisma.$transaction(async (tx) => {
          // Get current asset status with full details for email
          const asset = await tx.asset.findUnique({
            where: { id: item.assetId },
            select: {
              id: true,
              name: true,
              status: true,
              assetNumber: true,
              serialNumber: true,
              category: true,
              currentValue: true,
              purchasePrice: true,
              imageUrl: true
            }
          })

          if (!asset) {
            throw new Error(`Asset not found: ${item.assetId}`)
          }

          // Validate business logic
          if (action === 'CHECK_OUT') {
            if (asset.status !== 'AVAILABLE') {
              throw new Error(`Asset "${asset.name}" is ${asset.status.toLowerCase().replace('_', ' ')} and cannot be checked out`)
            }

            // Create check-out transaction
            const transaction = await tx.assetTransaction.create({
              data: {
                assetId: item.assetId,
                userId: item.assignedUserId || session.user.id,
                type: 'CHECK_OUT',
                status: 'ACTIVE',
                checkOutDate: new Date(),
                expectedReturnDate: item.expectedReturnDate ? new Date(item.expectedReturnDate) : null,
                notes: item.notes
              }
            })

            // Update asset status
            await tx.asset.update({
              where: { id: item.assetId },
              data: {
                status: 'CHECKED_OUT',
                lastModifiedById: session.user.id
              }
            })

            results.push({
              assetId: item.assetId,
              transactionId: transaction.id,
              action: 'CHECK_OUT',
              status: 'success'
            })

            // Collect asset for email
            processedAssets.push({
              ...asset,
              notes: item.notes,
              returnDate: item.expectedReturnDate || null
            })

          } else if (action === 'CHECK_IN') {
            if (asset.status !== 'CHECKED_OUT') {
              throw new Error(`Asset "${asset.name}" is ${asset.status.toLowerCase().replace('_', ' ')} and cannot be checked in`)
            }

            // Find the active check-out transaction
            const activeTransaction = await tx.assetTransaction.findFirst({
              where: {
                assetId: item.assetId,
                type: 'CHECK_OUT',
                status: 'ACTIVE'
              },
              orderBy: { checkOutDate: 'desc' }
            })

            if (!activeTransaction) {
              throw new Error(`No active check-out found for asset "${asset.name}"`)
            }

            // Update the transaction to completed
            await tx.assetTransaction.update({
              where: { id: activeTransaction.id },
              data: {
                status: 'COMPLETED',
                actualReturnDate: new Date(),
                notes: item.notes ? 
                  (activeTransaction.notes ? `${activeTransaction.notes}\n\nReturn notes: ${item.notes}` : `Return notes: ${item.notes}`) 
                  : activeTransaction.notes
              }
            })

            // Update asset status
            await tx.asset.update({
              where: { id: item.assetId },
              data: {
                status: 'AVAILABLE',
                lastModifiedById: session.user.id
              }
            })

            results.push({
              assetId: item.assetId,
              transactionId: activeTransaction.id,
              action: 'CHECK_IN',
              status: 'success'
            })

            // Collect asset for email
            processedAssets.push({
              ...asset,
              notes: item.notes || activeTransaction.notes || undefined
            })
          }

          processed++
        })
      } catch (error) {
        console.error(`Error processing item ${item.assetId}:`, error)
        errors.push(`${item.assetId}: ${error.message}`)
        results.push({
          assetId: item.assetId,
          action,
          status: 'error',
          error: error.message
        })
      }
    }

    // Send email if any transactions were successful
    if (processedAssets.length > 0 && session.user?.email) {
      try {
        const emailResult = await sendTransactionEmail({
          transactionType: action === 'CHECK_OUT' ? 'CHECKOUT' : 'CHECKIN',
          userName: session.user.name || session.user.email,
          userEmail: session.user.email,
          assets: processedAssets
        })

        if (!emailResult.success) {
          console.error('Failed to send transaction email:', emailResult.error)
        } else {
          console.log('Transaction email sent successfully')
        }
      } catch (emailError) {
        console.error('Error sending transaction email:', emailError)
        // Don't fail the transaction if email fails
      }
    }

    return NextResponse.json({
      processed,
      total: items.length,
      errors,
      results,
      success: processed > 0,
      emailSent: processedAssets.length > 0 && session.user?.email ? true : false
    })

  } catch (error) {
    console.error('Bulk transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}