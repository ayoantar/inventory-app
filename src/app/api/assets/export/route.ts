import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { formatCategory, formatStatus } from '@/lib/utils'

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
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const condition = searchParams.get('condition')
    const location = searchParams.get('location')
    const manufacturer = searchParams.get('manufacturer')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build the same filters as the assets API
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category && category !== '') {
      where.category = category
    }

    if (status && status !== '') {
      where.status = status
    }

    if (condition && condition !== '') {
      where.condition = condition
    }

    if (location && location !== '') {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (manufacturer && manufacturer !== '') {
      where.manufacturer = { contains: manufacturer, mode: 'insensitive' }
    }

    // Price range filters
    if (minPrice || maxPrice) {
      where.purchasePrice = {}
      if (minPrice) {
        where.purchasePrice.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        where.purchasePrice.lte = parseFloat(maxPrice)
      }
    }

    // Date range filters
    if (startDate || endDate) {
      where.purchaseDate = {}
      if (startDate) {
        where.purchaseDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.purchaseDate.lte = new Date(endDate)
      }
    }

    // Fetch all assets that match the criteria
    const assets = await prisma.asset.findMany({
      where,
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
      orderBy: { createdAt: 'desc' }
    })

    // Transform data for Excel export
    const excelData = assets.map(asset => ({
      'Asset Name': asset.name,
      'Category': formatCategory(asset.category),
      'Status': formatStatus(asset.status),
      'Condition': asset.condition,
      'Manufacturer': asset.manufacturer || '',
      'Model': asset.model || '',
      'Serial Number': asset.serialNumber || '',
      'Barcode': asset.barcode || '',
      'Location': asset.location || '',
      'Purchase Date': asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '',
      'Purchase Price': asset.purchasePrice || '',
      'Current Value': asset.currentValue || '',
      'Description': asset.description || '',
      'Notes': asset.notes || '',
      'Transactions': asset._count.transactions,
      'Created Date': new Date(asset.createdAt).toLocaleDateString(),
      'Created By': asset.createdBy?.name || '',
      'Last Modified': new Date(asset.updatedAt).toLocaleDateString(),
      'Last Modified By': asset.lastModifiedBy?.name || '',
      'Asset ID': asset.id
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = [
      { wch: 25 }, // Asset Name
      { wch: 15 }, // Category
      { wch: 15 }, // Status
      { wch: 12 }, // Condition
      { wch: 20 }, // Manufacturer
      { wch: 20 }, // Model
      { wch: 20 }, // Serial Number
      { wch: 15 }, // Barcode
      { wch: 20 }, // Location
      { wch: 15 }, // Purchase Date
      { wch: 15 }, // Purchase Price
      { wch: 15 }, // Current Value
      { wch: 30 }, // Description
      { wch: 30 }, // Notes
      { wch: 12 }, // Transactions
      { wch: 15 }, // Created Date
      { wch: 20 }, // Created By
      { wch: 15 }, // Last Modified
      { wch: 20 }, // Last Modified By
      { wch: 10 }  // Asset ID
    ]
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename with timestamp and filters
    let filename = 'LSVR-Assets'
    if (search) filename += `-Search-${search.replace(/[^a-zA-Z0-9]/g, '')}`
    if (category) filename += `-${category}`
    if (status) filename += `-${status}`
    filename += `-${new Date().toISOString().split('T')[0]}.xlsx`

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json(
      { error: 'Failed to export assets' },
      { status: 500 }
    )
  }
}