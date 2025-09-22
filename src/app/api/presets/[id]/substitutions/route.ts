import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/presets/[id]/substitutions - Apply substitutions for a preset
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { substitutions } = await request.json()
    // substitutions is a Record<string, string> mapping itemId to substituteAssetId

    // Get the preset with its items and their substitutions
    const preset = await prisma.preset.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            asset: true,
            substitutions: {
              include: {
                substituteAsset: true
              }
            }
          }
        }
      }
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Validate substitutions
    const validatedSubstitutions = []
    for (const [itemId, substituteAssetId] of Object.entries(substitutions)) {
      const presetItem = preset.items.find(item => item.id === itemId)
      if (!presetItem) {
        continue // Skip invalid item IDs
      }

      if (substituteAssetId) {
        // Check if this is a valid substitution for the item
        const validSubstitution = presetItem.substitutions.find(
          sub => sub.substituteAssetId === substituteAssetId
        )
        
        if (validSubstitution) {
          // Check if the substitute asset is available
          const substituteAsset = await prisma.asset.findUnique({
            where: { id: substituteAssetId }
          })
          
          if (substituteAsset && substituteAsset.status === 'AVAILABLE') {
            validatedSubstitutions.push({
              itemId,
              itemName: presetItem.name,
              originalAssetId: presetItem.assetId,
              substituteAssetId,
              substituteAsset: validSubstitution.substituteAsset
            })
          }
        }
      }
    }

    // Return the validated substitutions with asset details
    const response = {
      presetId: params.id,
      presetName: preset.name,
      substitutions: validatedSubstitutions,
      summary: {
        totalRequested: Object.keys(substitutions).length,
        validSubstitutions: validatedSubstitutions.length,
        readyToApply: validatedSubstitutions.length > 0
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to process substitutions:', error)
    return NextResponse.json({ error: 'Failed to process substitutions' }, { status: 500 })
  }
}

// GET /api/presets/[id]/substitutions - Get available substitutions for a preset
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preset = await prisma.preset.findUnique({
      where: { id: params.id },
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
        }
      }
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Format substitution options for each item
    const substitutionOptions = preset.items
      .filter(item => item.substitutions.length > 0)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        originalAsset: item.asset ? {
          id: item.asset.id,
          name: item.asset.name,
          description: item.asset.description,
          status: item.asset.status
        } : null,
        substitutes: item.substitutions
          .filter(sub => sub.substituteAsset.status === 'AVAILABLE')
          .map(sub => ({
            id: sub.substituteAsset.id,
            name: sub.substituteAsset.name,
            description: sub.substituteAsset.description,
            status: sub.substituteAsset.status,
            preference: sub.preference
          }))
          .sort((a, b) => a.preference - b.preference) // Sort by preference
      }))
      .filter(item => item.substitutes.length > 0) // Only include items with available substitutes

    return NextResponse.json({
      presetId: params.id,
      presetName: preset.name,
      substitutionOptions,
      summary: {
        totalItems: preset.items.length,
        itemsWithSubstitutions: substitutionOptions.length,
        totalAvailableSubstitutes: substitutionOptions.reduce((sum, item) => sum + item.substitutes.length, 0)
      }
    })
  } catch (error) {
    console.error('Failed to get substitutions:', error)
    return NextResponse.json({ error: 'Failed to get substitutions' }, { status: 500 })
  }
}