import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PresetMatch {
  preset: {
    id: string
    name: string
    description?: string
    category?: string
    priority: number
    _count: { items: number }
  }
  matchedItems: number
  totalItems: number
  matchPercentage: number
  missingItems: Array<{
    id: string
    name: string
    quantity: number
    isRequired: boolean
  }>
  availableSubstitutions?: Array<{
    itemId: string
    itemName: string
    substitutes: Array<{
      id: string
      name: string
      description?: string
      status: string
    }>
  }>
}

// POST /api/presets/detect - Detect matching presets based on scanned items
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assetIds } = await request.json()

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Get all active presets with their items and substitutions
    const presets = await prisma.preset.findMany({
      where: { isActive: true },
      include: {
        items: {
          include: {
            asset: {
              select: { id: true, name: true, description: true, status: true }
            },
            substitutions: {
              include: {
                substituteAsset: {
                  select: { id: true, name: true, description: true, status: true }
                }
              }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ]
    })

    const matches: PresetMatch[] = []

    for (const preset of presets) {
      let matchedItems = 0
      const missingItems = []
      const availableSubstitutions = []

      for (const item of preset.items) {
        let itemMatched = false

        // Check if the specific asset is in the scanned items
        if (item.assetId && assetIds.includes(item.assetId)) {
          matchedItems++
          itemMatched = true
        } else {
          // Check substitutions
          const matchingSubstitute = item.substitutions.find(sub => 
            assetIds.includes(sub.substituteAssetId)
          )
          
          if (matchingSubstitute) {
            matchedItems++
            itemMatched = true
          }
        }

        // If item not matched, add to missing items
        if (!itemMatched) {
          missingItems.push({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            isRequired: item.isRequired
          })

          // Check for available substitutions for missing items
          if (item.substitutions.length > 0) {
            const availableSubs = item.substitutions
              .filter(sub => sub.substituteAsset.status === 'AVAILABLE')
              .map(sub => ({
                id: sub.substituteAsset.id,
                name: sub.substituteAsset.name,
                description: sub.substituteAsset.description,
                status: sub.substituteAsset.status
              }))

            if (availableSubs.length > 0) {
              availableSubstitutions.push({
                itemId: item.id,
                itemName: item.name,
                substitutes: availableSubs
              })
            }
          }
        }
      }

      const matchPercentage = preset.items.length > 0 
        ? Math.round((matchedItems / preset.items.length) * 100)
        : 0

      // Only include presets with at least 30% match or if all required items are matched
      const requiredItems = preset.items.filter(item => item.isRequired)
      const matchedRequiredItems = requiredItems.filter(item => {
        if (item.assetId && assetIds.includes(item.assetId)) {
          return true
        }
        return item.substitutions.some(sub => assetIds.includes(sub.substituteAssetId))
      })

      const requiredItemsMatchPercentage = requiredItems.length > 0
        ? (matchedRequiredItems.length / requiredItems.length) * 100
        : 0 // Changed from 100 to 0 - presets with no required items shouldn't auto-match

      if (matchPercentage >= 30 || (requiredItems.length > 0 && requiredItemsMatchPercentage >= 80)) {
        matches.push({
          preset: {
            id: preset.id,
            name: preset.name,
            description: preset.description,
            category: preset.category,
            priority: preset.priority,
            _count: preset._count
          },
          matchedItems,
          totalItems: preset.items.length,
          matchPercentage,
          missingItems,
          availableSubstitutions: availableSubstitutions.length > 0 ? availableSubstitutions : undefined
        })
      }
    }

    // Sort matches by percentage (highest first), then by priority
    matches.sort((a, b) => {
      if (a.matchPercentage !== b.matchPercentage) {
        return b.matchPercentage - a.matchPercentage
      }
      return b.preset.priority - a.preset.priority
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Failed to detect presets:', error)
    return NextResponse.json({ error: 'Failed to detect presets' }, { status: 500 })
  }
}