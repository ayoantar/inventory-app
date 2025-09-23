'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/cart-context'

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

interface PresetDetectionPanelProps {
  onPresetSelect?: (presetId: string) => void
  onAddMissingItems?: (presetId: string, missingItems: any[]) => void
  onOpenSubstitutions?: (presetId: string, presetName: string, substitutions: any[]) => void
  isDetecting?: boolean
}

export default function PresetDetectionPanel({ 
  onPresetSelect, 
  onAddMissingItems,
  onOpenSubstitutions,
  isDetecting = false
}: PresetDetectionPanelProps) {
  const { state } = useCart()
  const [matches, setMatches] = useState<PresetMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (state.items.length === 0) {
      setMatches([])
      return
    }

    detectPresets()
  }, [state.items])

  const detectPresets = async () => {
    if (state.items.length === 0) return

    setLoading(true)
    try {
      const assetIds = state.items.map(item => item.assetId)
      const response = await fetch('/api/presets/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assetIds })
      })

      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
        
        // Auto-expand if we have good matches
        if (data.matches?.length > 0 && data.matches[0].matchPercentage >= 70) {
          setIsExpanded(true)
        }
      }
    } catch (error) {
      console.error('Failed to detect presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getMatchBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800'
    if (percentage >= 70) return 'bg-blue-100 text-blue-800'
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-orange-100 text-orange-800'
  }

  if (state.items.length === 0 || matches.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-3 text-left"
        >
          <div className="p-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Detected Presets
            </h3>
            <p className="text-sm text-brand-primary-text">
              {matches.length} preset{matches.length !== 1 ? 's' : ''} match your scanned items
            </p>
          </div>
          <svg 
            className={`w-5 h-5 text-white/50 hover:text-white/80 transition-colors transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
        )}
      </div>

      {/* Preset Matches */}
      {isExpanded && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-600/50 shadow-sm">
          <div className="p-6 space-y-4">
            {matches.map((match, index) => (
              <div key={match.preset.id} className={`relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md ${
                match.matchPercentage >= 90 
                  ? 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-200/50'
                  : match.matchPercentage >= 70
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200/50'
                  : 'bg-gradient-to-r from-orange-50 to-orange-100/50 border-orange-200/50'
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-brand-primary-text">
                          {match.preset.name}
                        </h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getMatchBadgeColor(match.matchPercentage)}`}>
                          {match.matchPercentage}% match
                        </span>
                        {match.preset.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-brand-primary-text">
                            {match.preset.category}
                          </span>
                        )}
                      </div>
                      {match.preset.description && (
                        <p className="text-sm text-brand-primary-text mb-3">
                          {match.preset.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-brand-primary-text">
                        Progress: {match.matchedItems} of {match.totalItems} items
                      </span>
                      <span className={`font-semibold ${getMatchColor(match.matchPercentage)}`}>
                        {match.matchPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          match.matchPercentage >= 90 
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : match.matchPercentage >= 70
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600'
                        }`}
                        style={{ width: `${match.matchPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Missing Items */}
                  {match.missingItems.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">
                        Missing Items ({match.missingItems.length}):
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {match.missingItems.slice(0, 5).map((item) => (
                          <span key={item.id} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.isRequired 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                          }`}>
                            {item.name} {item.quantity > 1 && `(${item.quantity})`}
                            {item.isRequired && ' *'}
                          </span>
                        ))}
                        {match.missingItems.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-brand-primary-text">
                            +{match.missingItems.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Available Substitutions */}
                  {match.availableSubstitutions && match.availableSubstitutions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-green-700 mb-2">
                        Available Substitutions:
                      </h5>
                      <div className="text-xs text-green-600">
                        {match.availableSubstitutions.length} item{match.availableSubstitutions.length !== 1 ? 's' : ''} have substitute options
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-3 border-t border-gray-700/50">
                    {match.matchPercentage >= 50 && (
                      <button
                        onClick={() => onPresetSelect?.(match.preset.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] text-sm"
                      >
                        Complete This Preset
                      </button>
                    )}
                    {match.missingItems.length > 0 && (
                      <button
                        onClick={() => onAddMissingItems?.(match.preset.id, match.missingItems)}
                        className="px-4 py-2 border border-gray-600 text-gray-300 hover rounded-lg font-medium transition-all duration-200 text-sm"
                      >
                        Add Missing Items
                      </button>
                    )}
                    {match.availableSubstitutions && match.availableSubstitutions.length > 0 && (
                      <button
                        onClick={() => onOpenSubstitutions?.(match.preset.id, match.preset.name, match.availableSubstitutions)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] text-sm"
                      >
                        View Substitutions
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority Indicator */}
                {match.preset.priority > 0 && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Priority {match.preset.priority}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}