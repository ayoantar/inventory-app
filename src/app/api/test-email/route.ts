import { NextRequest, NextResponse } from 'next/server'
import { sendTransactionEmail } from '@/lib/email-utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Send test email with sample data
    const result = await sendTransactionEmail({
      transactionType: 'CHECKOUT',
      userName: session.user.name || session.user.email,
      userEmail: session.user.email,
      assets: [
        {
          id: 'test-1',
          name: 'Sony FX6 Camera',
          assetNumber: 'CAM-001',
          serialNumber: 'SN123456',
          category: 'CAMERA',
          currentValue: 5999,
          imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200',
          notes: 'Test checkout - Please handle with care',
          returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        },
        {
          id: 'test-2',
          name: 'Zoom H6 Audio Recorder',
          assetNumber: 'AUD-015',
          serialNumber: 'ZH6789',
          category: 'AUDIO',
          currentValue: 349,
          notes: 'Includes windscreen and batteries',
          returnDate: null, // No return date
        }
      ],
      transactionDate: new Date(),
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${session.user.email}!`,
        details: result.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Email test failed',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
}