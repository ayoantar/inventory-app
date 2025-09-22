import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Search assets by barcode, QR code, serial number, or asset ID
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          { id: query },
          { barcode: query },
          { qrCode: query },
          { serialNumber: query },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        },
        _count: {
          select: { transactions: true }
        }
      },
      take: 10 // Limit results
    })

    return NextResponse.json(assets)

  } catch (error) {
    console.error('Asset search error:', error)
    return NextResponse.json(
      { error: 'Failed to search assets' },
      { status: 500 }
    )
  }
}