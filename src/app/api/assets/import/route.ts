import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { AssetCategory, AssetStatus, AssetCondition } from '../../../../../generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('📤 Excel import API called')
    console.log('✅ User authenticated:', session.user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('❌ No file provided in form data')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📁 File received:', file.name, 'Size:', file.size, 'bytes')

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      console.log('❌ Invalid file type:', file.name)
      return NextResponse.json({ error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' }, { status: 400 })
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[worksheetName]
    
    console.log('📋 Processing worksheet:', worksheetName)
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    if (jsonData.length < 2) {
      console.log('❌ Insufficient data rows:', jsonData.length)
      return NextResponse.json({ error: 'Excel file must contain at least a header row and one data row' }, { status: 400 })
    }

    console.log('📊 Total rows found:', jsonData.length, '(including header)')

    // Clean and normalize headers
    const rawHeaders = jsonData[0]
    const headers = rawHeaders.map((h: any) => {
      if (h === null || h === undefined) return ''
      return String(h).toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '')
    })
    
    console.log('🏷️ Raw headers found:', rawHeaders)
    console.log('🏷️ Cleaned headers:', headers)
    console.log('🔍 Looking for name variations in cleaned headers:', headers.filter(h => ['name', 'assetname', 'itemname', 'title', 'asset', 'item'].includes(h)))
    
    const dataRows = jsonData.slice(1)

    // Enhanced header mapping with multiple possible variations
    const headerVariations: { [key: string]: string[] } = {
      'name': ['name', 'assetname', 'itemname', 'title', 'asset', 'item'],
      'description': ['description', 'desc', 'details', 'note', 'info'],
      'category': ['category', 'type', 'class', 'group', 'cat'],
      'manufacturer': ['manufacturer', 'make', 'brand', 'mfg', 'maker'],
      'model': ['model', 'modelno', 'modelnumber', 'version'],
      'serialNumber': ['serialnumber', 'serial', 'sn', 'serialno', 'serialnum'],
      'barcode': ['barcode', 'code', 'id', 'itemid', 'assetid'],
      'location': ['location', 'room', 'place', 'where', 'site'],
      'purchaseDate': ['purchasedate', 'dateofpurchase', 'bought', 'acquired'],
      'purchasePrice': ['purchaseprice', 'price', 'cost', 'amount', 'value'],
      'currentValue': ['currentvalue', 'presentvalue', 'worth', 'marketvalue'],
      'condition': ['condition', 'state', 'quality', 'status'],
      'status': ['status', 'availability', 'state', 'condition'],
      'notes': ['notes', 'comments', 'remarks', 'memo', 'info']
    }

    // Create mapping of headers to column indices with fuzzy matching
    const headerMap: { [key: string]: number } = {}
    
    Object.keys(headerVariations).forEach(expectedHeader => {
      const variations = headerVariations[expectedHeader]
      console.log(`🔍 Searching for "${expectedHeader}" variations:`, variations)
      const index = headers.findIndex(h => variations.includes(h))
      if (index !== -1) {
        headerMap[expectedHeader] = index
        console.log(`✅ Mapped "${expectedHeader}" to column ${index} (header: "${rawHeaders[index]}")`)
      } else {
        console.log(`❌ No match found for "${expectedHeader}"`)
      }
    })

    console.log('🗺️ Header mapping result:', headerMap)

    // Special debug for name column
    console.log('🔍 Detailed name column search:')
    console.log('  - Raw headers:', rawHeaders)
    console.log('  - Cleaned headers:', headers)
    console.log('  - Name variations to match:', headerVariations.name)
    console.log('  - Found name match at index:', headerMap.name)

    // Validate required fields
    if (headerMap.name === undefined) {
      const availableHeaders = rawHeaders.filter(h => h !== null && h !== undefined && h !== '').join(', ')
      console.log('❌ No name column found. Available headers:', availableHeaders)
      
      // Try a more lenient search for debugging
      const nameIndex = rawHeaders.findIndex((h: any) => {
        if (!h) return false
        const headerStr = String(h).toLowerCase().trim()
        return headerStr === 'name' || headerStr.includes('name')
      })
      
      console.log('🔍 Lenient name search result:', nameIndex, nameIndex >= 0 ? rawHeaders[nameIndex] : 'not found')
      
      return NextResponse.json({ 
        error: `Missing required column: "name". Available columns: ${availableHeaders}. Please ensure your Excel file has a column named "name", "asset name", "item name", or similar.` 
      }, { status: 400 })
    }

    const results = {
      total: dataRows.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + 2 // +2 because we start from row 2 in Excel (header is row 1)

      try {
        // Extract data from row
        const assetData = {
          name: row[headerMap.name]?.toString().trim(),
          description: headerMap.description !== undefined ? row[headerMap.description]?.toString().trim() || null : null,
          category: headerMap.category !== undefined ? validateCategory(row[headerMap.category]?.toString().trim()) : 'OTHER' as AssetCategory,
          manufacturer: headerMap.manufacturer !== undefined ? row[headerMap.manufacturer]?.toString().trim() || null : null,
          model: headerMap.model !== undefined ? row[headerMap.model]?.toString().trim() || null : null,
          serialNumber: headerMap.serialNumber !== undefined ? row[headerMap.serialNumber]?.toString().trim() || null : null,
          barcode: headerMap.barcode !== undefined ? row[headerMap.barcode]?.toString().trim() || null : null,
          location: headerMap.location !== undefined ? row[headerMap.location]?.toString().trim() || null : null,
          purchaseDate: headerMap.purchaseDate !== undefined ? parseDateString(row[headerMap.purchaseDate]) : null,
          purchasePrice: headerMap.purchasePrice !== undefined ? parseFloat(row[headerMap.purchasePrice]?.toString().replace(/[,$]/g, '')) || null : null,
          currentValue: headerMap.currentValue !== undefined ? parseFloat(row[headerMap.currentValue]?.toString().replace(/[,$]/g, '')) || null : null,
          condition: headerMap.condition !== undefined ? validateCondition(row[headerMap.condition]?.toString().trim()) : 'GOOD' as AssetCondition,
          status: headerMap.status !== undefined ? validateStatus(row[headerMap.status]?.toString().trim()) : 'AVAILABLE' as AssetStatus,
          notes: headerMap.notes !== undefined ? row[headerMap.notes]?.toString().trim() || null : null,
          createdById: session.user.id,
          lastModifiedById: session.user.id
        }

        // Validate required fields
        if (!assetData.name) {
          results.errors.push(`Row ${rowNumber}: Asset name is required`)
          results.failed++
          continue
        }

        // Check for duplicate asset names
        const existingAsset = await prisma.asset.findFirst({
          where: { name: assetData.name }
        })

        if (existingAsset) {
          results.errors.push(`Row ${rowNumber}: Asset with name "${assetData.name}" already exists`)
          results.failed++
          continue
        }

        // Create the asset
        await prisma.asset.create({
          data: assetData
        })

        results.successful++
      } catch (error) {
        results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        results.failed++
      }
    }

    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import assets' },
      { status: 500 }
    )
  }
}

function validateCategory(category: string | undefined): AssetCategory {
  if (!category) return 'OTHER'
  
  const upperCategory = category.toUpperCase()
  const validCategories: AssetCategory[] = [
    'CAMERA', 'LENS', 'LIGHTING', 'AUDIO', 'COMPUTER', 
    'STORAGE', 'ACCESSORY', 'FURNITURE', 'SOFTWARE', 'OTHER'
  ]
  
  return validCategories.includes(upperCategory as AssetCategory) ? upperCategory as AssetCategory : 'OTHER'
}

function validateStatus(status: string | undefined): AssetStatus {
  if (!status) return 'AVAILABLE'
  
  const upperStatus = status.toUpperCase().replace(/\s+/g, '_')
  const validStatuses: AssetStatus[] = [
    'AVAILABLE', 'CHECKED_OUT', 'IN_MAINTENANCE', 'RETIRED', 'MISSING', 'RESERVED'
  ]
  
  return validStatuses.includes(upperStatus as AssetStatus) ? upperStatus as AssetStatus : 'AVAILABLE'
}

function validateCondition(condition: string | undefined): AssetCondition {
  if (!condition) return 'GOOD'
  
  const upperCondition = condition.toUpperCase().replace(/\s+/g, '_')
  const validConditions: AssetCondition[] = [
    'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR'
  ]
  
  return validConditions.includes(upperCondition as AssetCondition) ? upperCondition as AssetCondition : 'GOOD'
}

function parseDateString(dateValue: any): Date | null {
  if (!dateValue) return null
  
  // Handle Excel date serial numbers
  if (typeof dateValue === 'number') {
    // Excel date serial number to JavaScript Date
    const excelEpoch = new Date(1899, 11, 30) // Excel's epoch
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000)
    return date
  }
  
  // Handle string dates
  const dateString = dateValue.toString().trim()
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null
  }
  
  return date
}