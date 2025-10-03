import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAssetNumber } from '@/lib/asset-number-generator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const status = searchParams.get('status') || ''
  const condition = searchParams.get('condition') || ''
  const location = searchParams.get('location') || ''
  const manufacturer = searchParams.get('manufacturer') || ''
  const client = searchParams.get('client') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const includeTransactions = searchParams.get('includeTransactions') === 'true'
  const includeMaintenanceRecords = searchParams.get('includeMaintenanceRecords') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

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

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (status) {
    where.status = status
  }

  if (condition) {
    where.condition = condition
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' }
  }

  if (manufacturer) {
    where.manufacturer = { contains: manufacturer, mode: 'insensitive' }
  }

  if (client) {
    where.clientId = client
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

    const includeConfig: any = {
      category: { select: { id: true, name: true } },
      client: { select: { name: true, code: true, isActive: true } },
      createdBy: { select: { name: true, email: true } },
      lastModifiedBy: { select: { name: true, email: true } },
      _count: { select: { transactions: true } }
    }

    if (includeTransactions) {
      includeConfig.transactions = {
        include: {
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }

    if (includeMaintenanceRecords) {
      includeConfig.maintenanceRecords = {
        orderBy: { createdAt: 'desc' }
      }
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        include: includeConfig,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ])

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Assets GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      categoryId,
      assetNumber,
      clientId,
      serialNumber,
      barcode,
      qrCode,
      locationId,
      purchaseDate,
      purchasePrice,
      currentValue,
      condition,
      manufacturer,
      model,
      notes,
      imageUrl
    } = body

    // Validate required fields
    if (!name || !categoryId || !clientId) {
      return NextResponse.json(
        { error: 'Name, category, and client are required' },
        { status: 400 }
      )
    }

    // Get client information for asset number generation
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { code: true }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid client selected' },
        { status: 400 }
      )
    }

    // Generate asset number if not provided
    let finalAssetNumber = assetNumber
    if (!finalAssetNumber) {
      finalAssetNumber = await generateAssetNumber(client.code, categoryId)
    }

    // Check for duplicate asset number
    if (finalAssetNumber) {
      const existingAsset = await prisma.asset.findUnique({
        where: { assetNumber: finalAssetNumber }
      })
      if (existingAsset) {
        return NextResponse.json(
          { error: 'Asset with this asset number already exists' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate serial number, barcode, or QR code
    if (serialNumber && serialNumber.trim() !== '') {
      const existingAsset = await prisma.asset.findUnique({
        where: { serialNumber }
      })
      if (existingAsset) {
        return NextResponse.json(
          { error: 'Asset with this serial number already exists' },
          { status: 400 }
        )
      }
    }

    if (barcode && barcode.trim() !== '') {
      const existingAsset = await prisma.asset.findUnique({
        where: { barcode }
      })
      if (existingAsset) {
        return NextResponse.json(
          { error: 'Asset with this barcode already exists' },
          { status: 400 }
        )
      }
    }

    if (qrCode && qrCode.trim() !== '') {
      const existingAsset = await prisma.asset.findUnique({
        where: { qrCode }
      })
      if (existingAsset) {
        return NextResponse.json(
          { error: 'Asset with this QR code already exists' },
          { status: 400 }
        )
      }
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        description,
        categoryId,
        assetNumber: finalAssetNumber,
        clientId,
        serialNumber: serialNumber && serialNumber.trim() !== '' ? serialNumber : null,
        barcode: barcode && barcode.trim() !== '' ? barcode : null,
        qrCode: qrCode && qrCode.trim() !== '' ? qrCode : null,
        locationId: locationId && locationId.trim() !== '' ? locationId : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        condition,
        manufacturer,
        model,
        notes,
        imageUrl,
        createdById: session.user.id,
        lastModifiedById: session.user.id
      },
      include: {
        client: {
          select: { name: true, code: true }
        },
        locationRef: {
          select: { id: true, name: true, building: true, floor: true, room: true }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        }
      }
    })

    // Update the location string field based on locationRef
    if (asset.locationRef) {
      const locationString = asset.locationRef.building && asset.locationRef.floor
        ? `${asset.locationRef.name} (${asset.locationRef.building} - Floor ${asset.locationRef.floor})`
        : asset.locationRef.building
          ? `${asset.locationRef.name} (${asset.locationRef.building})`
          : asset.locationRef.name

      await prisma.asset.update({
        where: { id: asset.id },
        data: { location: locationString }
      })
    }

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Assets POST error:', error?.code === 'P2002' ? `Unique constraint violation: ${error?.meta?.target?.[0]}` : error)
    
    // Handle Prisma unique constraint violations
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0]
      let message = 'A record with this value already exists'
      
      if (field === 'assetNumber') {
        message = 'Asset with this asset number already exists'
      } else if (field === 'serialNumber') {
        message = 'Asset with this serial number already exists'
      } else if (field === 'barcode') {
        message = 'Asset with this barcode already exists'
      } else if (field === 'qrCode') {
        message = 'Asset with this QR code already exists'
      }
      
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    )
  }
}