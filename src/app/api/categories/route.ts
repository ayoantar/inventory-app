import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// System-defined categories that cannot be edited/deleted
const SYSTEM_CATEGORIES = [
  { id: 'CAMERA', name: 'Camera', description: 'Camera equipment and bodies', icon: '📷' },
  { id: 'LENS', name: 'Lens', description: 'Camera lenses and optics', icon: '🔍' },
  { id: 'LIGHTING', name: 'Lighting', description: 'Lighting equipment and accessories', icon: '💡' },
  { id: 'AUDIO', name: 'Audio', description: 'Audio recording and sound equipment', icon: '🎵' },
  { id: 'COMPUTER', name: 'Computer', description: 'Computers and computing devices', icon: '💻' },
  { id: 'STORAGE', name: 'Storage', description: 'Storage devices and media', icon: '💾' },
  { id: 'ACCESSORY', name: 'Accessory', description: 'General accessories and tools', icon: '🔧' },
  { id: 'FURNITURE', name: 'Furniture', description: 'Furniture and fixtures', icon: '🪑' },
  { id: 'SOFTWARE', name: 'Software', description: 'Software licenses and applications', icon: '💿' },
  { id: 'INFORMATION_TECHNOLOGY', name: 'Information Technology', description: 'IT infrastructure and networking equipment', icon: '🖥️' },
  { id: 'OTHER', name: 'Other', description: 'Other equipment not fitting above categories', icon: '📦' }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get custom categories from database
    const customCategories = await prisma.customCategory.findMany({
      orderBy: { name: 'asc' }
    })

    // Combine system and custom categories
    const allCategories = [
      ...SYSTEM_CATEGORIES.map(cat => ({ ...cat, isCustom: false })),
      ...customCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: '📁', // Default icon for custom categories
        isCustom: true
      }))
    ]

    return NextResponse.json({
      categories: allCategories,
      pagination: {
        page: 1,
        limit: allCategories.length,
        total: allCategories.length,
        pages: 1
      }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate a readable category code
function generateCategoryCode(name: string): string {
  // Remove special characters and convert to uppercase
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  
  // Split into words and take first 3 letters of each word, max 3 words
  const words = cleanName.split(/\s+/).slice(0, 3)
  let code = ''
  
  for (const word of words) {
    if (word.length >= 3) {
      code += word.substring(0, 3).toUpperCase()
    } else if (word.length > 0) {
      code += word.toUpperCase()
    }
  }
  
  // Ensure minimum length of 3 characters
  if (code.length < 3) {
    code = code.padEnd(3, 'X')
  }
  
  // Limit to 9 characters maximum
  return code.substring(0, 9)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if category name already exists
    const existingCategory = await prisma.customCategory.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 400 })
    }

    // Check against system categories
    const systemCategoryExists = SYSTEM_CATEGORIES.some(
      cat => cat.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (systemCategoryExists) {
      return NextResponse.json({ error: 'Category name conflicts with system category' }, { status: 400 })
    }

    // Generate a readable category code
    let baseCode = generateCategoryCode(name.trim())
    let finalCode = baseCode
    let counter = 1

    // Ensure the code is unique (check against both system and custom categories)
    const systemCodes = SYSTEM_CATEGORIES.map(cat => cat.id)
    
    while (true) {
      // Check if code conflicts with system categories
      if (systemCodes.includes(finalCode)) {
        finalCode = `${baseCode}${counter}`
        counter++
        continue
      }

      // Check if code conflicts with existing custom categories
      const existingCode = await prisma.customCategory.findFirst({
        where: { id: finalCode }
      })

      if (!existingCode) {
        break
      }

      finalCode = `${baseCode}${counter}`
      counter++
    }

    const category = await prisma.customCategory.create({
      data: {
        id: finalCode,
        name: name.trim(),
        description: description?.trim() || '',
        createdById: session.user.id
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}