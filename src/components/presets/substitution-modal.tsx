'use client'

import { useState } from 'react'
import { useScrollLock } from '@/hooks/useScrollLock'

interface SubstituteOption {
  id: string
  name: string
  description?: string
  status: string
}

interface SubstitutionItem {
  itemId: string
  itemName: string
  substitutes: SubstituteOption[]
}

interface SubstitutionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selections: Record<string, string>) => void
  availableSubstitutions: SubstitutionItem[]
  presetName: string
}

export default function SubstitutionModal({
  useScrollLock(isOpen)

  isOpen,
  onClose,
  onConfirm,
  availableSubstitutions,
  presetName
}: SubstitutionModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSelectionChange = (itemId: string, substituteId: string) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: substituteId
    }))
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(selections)
      onClose()
    } catch (error) {
      console.error('Failed to apply substitutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = Object.keys(selections).length
  const totalItems = availableSubstitutions.length

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/5 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-brand-primary-text">
                Item Substitutions
              </h2>
              <p className="text-sm text-brand-primary-text mt-1">
                Select substitute items for "{presetName}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-gray-900/5/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-primary-text">
              Substitutions selected: {selectedCount} of {totalItems}
            </span>
            <span className="font-medium text-purple-600">
              {Math.round((selectedCount / totalItems) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedCount / totalItems) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {availableSubstitutions.map((item) => (
              <div key={item.itemId} className="border border-gray-600 rounded-xl p-4">
                <div className="mb-3">
                  <h3 className="font-medium text-brand-primary-text flex items-center">
                    <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Missing: {item.itemName}
                  </h3>
                  <p className="text-sm text-brand-primary-text">
                    Select a substitute item from the available options:
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-600 rounded-lg hover cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={`substitute-${item.itemId}`}
                      value=""
                      checked={!selections[item.itemId]}
                      onChange={() => {
                        const newSelections = { ...selections }
                        delete newSelections[item.itemId]
                        setSelections(newSelections)
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-600 focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm text-gray-300">
                      Skip this item (proceed without substitute)
                    </span>
                  </label>

                  {item.substitutes.map((substitute) => (
                    <label 
                      key={substitute.id} 
                      className="flex items-center p-3 border border-gray-600 rounded-lg hover cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={`substitute-${item.itemId}`}
                        value={substitute.id}
                        checked={selections[item.itemId] === substitute.id}
                        onChange={() => handleSelectionChange(item.itemId, substitute.id)}
                        className="w-4 h-4 text-purple-600 border-gray-600 focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-brand-primary-text">
                            {substitute.name}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            substitute.status === 'AVAILABLE' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {substitute.status}
                          </span>
                        </div>
                        {substitute.description && (
                          <p className="text-xs text-brand-primary-text mt-1">
                            {substitute.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/5/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-brand-primary-text">
              {selectedCount > 0 && (
                <>Selected {selectedCount} substitute{selectedCount !== 1 ? 's' : ''}</>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-600 text-gray-300 hover rounded-lg font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Substitutions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}