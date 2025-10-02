import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true, code: true, isActive: true }
        },
        locationRef: {
          select: { id: true, name: true, building: true, floor: true, room: true }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        },
        transactions: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        maintenanceRecords: {
          include: {
            performedBy: {
              select: { name: true, email: true }
            }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        },
        _count: {
          select: { transactions: true }
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json(asset)

  } catch (error) {
    console.error('Asset GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      category,
      serialNumber,
      barcode,
      qrCode,
      status,
      location,
      locationId,
      clientId,
      assetNumber,
      purchaseDate,
      purchasePrice,
      currentValue,
      condition,
      manufacturer,
      model,
      notes,
      imageUrl
    } = body


    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check for duplicate serial number or barcode (excluding current asset)
    if (serialNumber && serialNumber !== existingAsset.serialNumber) {
      const duplicateSerial = await prisma.asset.findFirst({
        where: { 
          serialNumber,
          id: { not: id }
        }
      })
      if (duplicateSerial) {
        return NextResponse.json(
          { error: 'Asset with this serial number already exists' },
          { status: 400 }
        )
      }
    }

    if (barcode && barcode !== existingAsset.barcode) {
      const duplicateBarcode = await prisma.asset.findFirst({
        where: { 
          barcode,
          id: { not: id }
        }
      })
      if (duplicateBarcode) {
        return NextResponse.json(
          { error: 'Asset with this barcode already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name,
      description,
      category,
      status,
      location,
      locationId: locationId || null,
      clientId: clientId || null,
      assetNumber: assetNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      currentValue: currentValue ? parseFloat(currentValue) : null,
      condition,
      manufacturer,
      model,
      notes,
      imageUrl,
      lastModifiedById: session.user.id
    }

    // Only update serialNumber if it's actually different and not empty
    if (serialNumber && serialNumber.trim() && serialNumber !== existingAsset.serialNumber) {
      updateData.serialNumber = serialNumber
    } else if (!serialNumber && existingAsset.serialNumber) {
      // Setting it to null if it was previously set and now empty
      updateData.serialNumber = null
    }

    // Only update barcode if it's actually different and not empty
    if (barcode && barcode.trim() && barcode !== existingAsset.barcode) {
      updateData.barcode = barcode
    } else if (!barcode && existingAsset.barcode) {
      // Setting it to null if it was previously set and now empty
      updateData.barcode = null
    }

    // Only update qrCode if it's actually different and not empty
    if (qrCode && qrCode.trim() && qrCode !== existingAsset.qrCode) {
      updateData.qrCode = qrCode
    } else if (!qrCode && existingAsset.qrCode) {
      // Setting it to null if it was previously set and now empty
      updateData.qrCode = null
    }

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { name: true, code: true, isActive: true }
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
    if (updatedAsset.locationRef) {
      const locationString = updatedAsset.locationRef.building && updatedAsset.locationRef.floor
        ? `${updatedAsset.locationRef.name} (${updatedAsset.locationRef.building} - Floor ${updatedAsset.locationRef.floor})`
        : updatedAsset.locationRef.building
          ? `${updatedAsset.locationRef.name} (${updatedAsset.locationRef.building})`
          : updatedAsset.locationRef.name

      await prisma.asset.update({
        where: { id },
        data: { location: locationString }
      })
    } else if (locationId === null || locationId === '') {
      await prisma.asset.update({
        where: { id },
        data: { location: null }
      })
    }

    return NextResponse.json(updatedAsset)

  } catch (error) {
    console.error('Asset PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete assets
    const userRole = (session.user as any)?.role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Check if asset has active transactions
    if (asset.transactions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete asset with active transactions' },
        { status: 400 }
      )
    }

    await prisma.asset.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Asset deleted successfully' })

  } catch (error) {
    console.error('Asset DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    )
  }
}