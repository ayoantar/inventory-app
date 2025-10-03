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
    const format = searchParams.get('format') || 'excel'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 30 days if no date range provided
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)
    
    const dateFilter = {
      gte: startDate ? new Date(startDate) : defaultStartDate,
      lte: endDate ? new Date(endDate) : new Date()
    }

    // Fetch comprehensive data for the report
    const [
      assets,
      transactions,
      maintenanceRecords,
      assetStats,
      transactionStats,
      maintenanceStats
    ] = await Promise.all([
      // All assets with full details
      prisma.asset.findMany({
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { name: true, email: true } },
          lastModifiedBy: { select: { name: true, email: true } },
          _count: { select: { transactions: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Transactions in date range
      prisma.assetTransaction.findMany({
        where: { createdAt: dateFilter },
        include: {
          asset: {
            select: {
              name: true,
              serialNumber: true,
              category: { select: { id: true, name: true } }
            }
          },
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Maintenance records in date range
      prisma.maintenanceRecord.findMany({
        where: {
          OR: [
            { scheduledDate: dateFilter },
            { performedDate: dateFilter },
            { createdAt: dateFilter }
          ]
        },
        include: {
          asset: {
            select: {
              name: true,
              serialNumber: true,
              category: { select: { id: true, name: true } }
            }
          },
          performedBy: { select: { name: true, email: true } },
          createdBy: { select: { name: true, email: true } }
        },
        orderBy: { scheduledDate: 'desc' }
      }),

      // Asset statistics
      Promise.all([
        prisma.asset.groupBy({ by: ['categoryId'], _count: { categoryId: true } }),
        prisma.asset.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.asset.groupBy({ by: ['condition'], _count: { condition: true } }),
        prisma.asset.aggregate({ _sum: { currentValue: true, purchasePrice: true } })
      ]),

      // Transaction statistics
      prisma.assetTransaction.groupBy({
        by: ['type'],
        _count: { type: true },
        where: { createdAt: dateFilter }
      }),

      // Maintenance statistics
      prisma.maintenanceRecord.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { actualCost: true, estimatedCost: true },
        where: {
          OR: [
            { scheduledDate: dateFilter },
            { performedDate: dateFilter },
            { createdAt: dateFilter }
          ]
        }
      })
    ])

    if (format === 'excel') {
      return generateExcelReport({
        assets,
        transactions,
        maintenanceRecords,
        assetStats,
        transactionStats,
        maintenanceStats,
        dateRange: { startDate: dateFilter.gte, endDate: dateFilter.lte }
      })
    } else {
      return NextResponse.json(
        { error: 'PDF export not yet implemented' },
        { status: 501 }
      )
    }

  } catch (error) {
    console.error('Report export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['LSVR Inventory Management - Analytics Report'],
    ['Generated:', new Date().toLocaleDateString()],
    ['Period:', `${data.dateRange.startDate.toLocaleDateString()} - ${data.dateRange.endDate.toLocaleDateString()}`],
    [''],
    ['OVERVIEW'],
    ['Total Assets:', data.assets.length],
    ['Total Current Value:', `$${data.assetStats[3]._sum.currentValue || 0}`],
    ['Total Purchase Value:', `$${data.assetStats[3]._sum.purchasePrice || 0}`],
    ['Transactions (Period):', data.transactions.length],
    ['Maintenance Records (Period):', data.maintenanceRecords.length],
    [''],
    ['ASSETS BY CATEGORY'],
    ...data.assetStats[0].map((cat: any) => [formatCategory(cat.categoryId || 'No Category'), cat._count.categoryId]),
    [''],
    ['ASSETS BY STATUS'],
    ...data.assetStats[1].map((status: any) => [formatStatus(status.status), status._count.status]),
    [''],
    ['ASSETS BY CONDITION'],
    ...data.assetStats[2].map((cond: any) => [cond.condition.replace('_', ' '), cond._count.condition])
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Assets sheet
  const assetsData = data.assets.map((asset: any) => ({
    'Asset ID': asset.id,
    'Name': asset.name,
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
    'Transaction Count': asset._count.transactions,
    'Created Date': new Date(asset.createdAt).toLocaleDateString(),
    'Created By': asset.createdBy?.name || '',
    'Last Modified': new Date(asset.updatedAt).toLocaleDateString(),
    'Last Modified By': asset.lastModifiedBy?.name || ''
  }))

  const assetsSheet = XLSX.utils.json_to_sheet(assetsData)
  XLSX.utils.book_append_sheet(workbook, assetsSheet, 'Assets')

  // Transactions sheet
  const transactionsData = data.transactions.map((transaction: any) => ({
    'Transaction ID': transaction.id,
    'Asset': transaction.asset.name,
    'Asset Serial': transaction.asset.serialNumber || '',
    'Type': transaction.type.replace('_', ' '),
    'Status': transaction.status,
    'User': transaction.user.name || '',
    'User Email': transaction.user.email || '',
    'Due Date': transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : '',
    'Returned Date': transaction.returnedDate ? new Date(transaction.returnedDate).toLocaleDateString() : '',
    'Notes': transaction.notes || '',
    'Created Date': new Date(transaction.createdAt).toLocaleDateString()
  }))

  const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData)
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions')

  // Maintenance sheet
  const maintenanceData = data.maintenanceRecords.map((record: any) => ({
    'Maintenance ID': record.id,
    'Asset': record.asset.name,
    'Asset Serial': record.asset.serialNumber || '',
    'Type': record.type.replace('_', ' '),
    'Description': record.description,
    'Status': formatStatus(record.status),
    'Priority': record.priority,
    'Scheduled Date': record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString() : '',
    'Performed Date': record.performedDate ? new Date(record.performedDate).toLocaleDateString() : '',
    'Estimated Cost': record.estimatedCost || '',
    'Actual Cost': record.actualCost || '',
    'Performed By': record.performedBy?.name || '',
    'Created By': record.createdBy?.name || '',
    'Notes': record.notes || '',
    'Completion Notes': record.completionNotes || '',
    'Created Date': new Date(record.createdAt).toLocaleDateString()
  }))

  const maintenanceSheet = XLSX.utils.json_to_sheet(maintenanceData)
  XLSX.utils.book_append_sheet(workbook, maintenanceSheet, 'Maintenance')

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  // Generate filename
  const startDateStr = data.dateRange.startDate.toISOString().split('T')[0]
  const endDateStr = data.dateRange.endDate.toISOString().split('T')[0]
  const filename = `LSVR-Analytics-Report-${startDateStr}-to-${endDateStr}.xlsx`

  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length.toString()
    }
  })
}