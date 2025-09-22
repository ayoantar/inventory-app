import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SYSTEM_CATEGORY_IDS = ['CAMERA', 'LENS', 'LIGHTING', 'AUDIO', 'COMPUTER', 'STORAGE', 'ACCESSORY', 'FURNITURE', 'SOFTWARE', 'OTHER']

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const { name, description } = await request.json()

    // Check if it's a system category
    if (SYSTEM_CATEGORY_IDS.includes(id)) {
      return NextResponse.json({ error: 'Cannot edit system categories' }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if the category exists
    const existingCategory = await prisma.customCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if the name conflicts with another category (excluding current one)
    const nameConflict = await prisma.customCategory.findFirst({
      where: { 
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: id }
      }
    })

    if (nameConflict) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    }

    const updatedCategory = await prisma.customCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        lastModifiedById: session.user.id
      }
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('DELETE request for category ID:', id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('No session found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    console.log('User role:', userRole)
    
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      console.log('Insufficient permissions for role:', userRole)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // id already extracted above
    console.log('Attempting to delete category with ID:', id)

    // Check if it's a system category
    if (SYSTEM_CATEGORY_IDS.includes(id)) {
      console.log('Attempted to delete system category:', id)
      return NextResponse.json({ error: 'Cannot delete system categories' }, { status: 400 })
    }

    // Check if the category exists
    const existingCategory = await prisma.customCategory.findUnique({
      where: { id }
    })

    console.log('Found existing category:', existingCategory)

    if (!existingCategory) {
      console.log('Category not found with ID:', id)
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Note: Custom categories are not yet integrated with the asset system
    // The asset.category field only uses the AssetCategory enum (system categories)
    // When custom categories are integrated, we'll need to add a separate field or relationship

    console.log('Deleting category:', existingCategory.name)
    await prisma.customCategory.delete({
      where: { id }
    })

    console.log('Category deleted successfully')
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}