import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/presets/[id]/complete - Start a preset checkout workflow
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scannedAssetIds, expectedReturnDate } = await request.json()

    // Get the preset with all its items and substitutions
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

    // Create a preset checkout record
    const presetCheckout = await prisma.$transaction(async (tx) => {
      // Create the preset checkout
      const checkout = await tx.presetCheckout.create({
        data: {
          presetId: params.id,
          userId: session.user.id,
          status: 'IN_PROGRESS',
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          notes: `Auto-generated from cart scanning`
        }
      })

      // Process each preset item
      let completionCount = 0
      const checkoutItems = []

      for (const presetItem of preset.items) {
        let assignedAssetId: string | null = null
        let isSubstitute = false
        let status: 'PENDING' | 'ASSIGNED' | 'CHECKED_OUT' | 'SUBSTITUTED' | 'UNAVAILABLE' | 'SKIPPED' = 'PENDING'

        // Check if the specific asset is in the scanned items
        if (presetItem.assetId && scannedAssetIds.includes(presetItem.assetId)) {
          assignedAssetId = presetItem.assetId
          status = 'ASSIGNED'
          completionCount++
        } else {
          // Check for substitutions
          const matchingSubstitute = presetItem.substitutions.find(sub => 
            scannedAssetIds.includes(sub.substituteAssetId)
          )
          
          if (matchingSubstitute) {
            assignedAssetId = matchingSubstitute.substituteAssetId
            isSubstitute = true
            status = 'SUBSTITUTED'
            completionCount++
          } else {
            // Item not available
            status = presetItem.isRequired ? 'UNAVAILABLE' : 'SKIPPED'
          }
        }

        const checkoutItem = await tx.presetCheckoutItem.create({
          data: {
            presetCheckoutId: checkout.id,
            presetItemId: presetItem.id,
            assetId: assignedAssetId,
            status,
            isSubstitute,
            notes: isSubstitute ? 'Used substitute asset' : undefined
          }
        })

        checkoutItems.push(checkoutItem)
      }

      // Calculate completion percentage
      const completionPercent = preset.items.length > 0 
        ? Math.round((completionCount / preset.items.length) * 100)
        : 0

      // Update the checkout with completion percentage
      await tx.presetCheckout.update({
        where: { id: checkout.id },
        data: { completionPercent }
      })

      return {
        ...checkout,
        completionPercent,
        items: checkoutItems
      }
    })

    // Return the checkout details with recommendations
    const response = {
      presetCheckout,
      recommendations: {
        readyToProcess: presetCheckout.completionPercent >= 80,
        missingRequiredItems: preset.items.filter(item => 
          item.isRequired && !scannedAssetIds.includes(item.assetId || '') &&
          !item.substitutions.some(sub => scannedAssetIds.includes(sub.substituteAssetId))
        ).length,
        availableSubstitutions: preset.items
          .filter(item => !scannedAssetIds.includes(item.assetId || ''))
          .map(item => ({
            itemId: item.id,
            itemName: item.name,
            substitutes: item.substitutions
              .filter(sub => sub.substituteAsset.status === 'AVAILABLE')
              .map(sub => ({
                id: sub.substituteAsset.id,
                name: sub.substituteAsset.name,
                description: sub.substituteAsset.description
              }))
          }))
          .filter(item => item.substitutes.length > 0)
      }
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Failed to complete preset:', error)
    return NextResponse.json({ error: 'Failed to complete preset' }, { status: 500 })
  }
}