'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MaintenanceAsset {
  id: string
  name: string
  description?: string
  serialNumber?: string
  category: string
  location?: string
  currentValue?: number
  purchasePrice?: number
  imageUrl?: string
  maintenanceRecords: {
    id: string
    type: string
    description: string
    priority: string
    status: string
    scheduledDate?: string
    cost?: number
    createdAt: string
  }[]
}

interface MaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MaintenanceModal({ isOpen, onClose }: MaintenanceModalProps) {
  const [assets, setAssets] = useState<MaintenanceAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchMaintenanceAssets()
    }
  }, [isOpen])

  const fetchMaintenanceAssets = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/assets?status=IN_MAINTENANCE&includeMaintenanceRecords=true')
      if (response.ok) {
        const data = await response.json()
        setAssets(data.assets || [])
      } else {
        setError('Failed to fetch maintenance assets')
      }
    } catch (error) {
      setError('An error occurred while fetching assets')
    } finally {
      setLoading(false)
    }
  }

  const getMaintenanceTypeIcon = (type: string) => {
    const icons = {
      INSPECTION: '🔍',
      PREVENTIVE: '🛡️',
      CORRECTIVE: '🔧',
      CLEANING: '🧽',
      CALIBRATION: '⚖️'
    }
    return icons[type as keyof typeof icons] || '🔧'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-gray-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
    return colors[priority as keyof typeof colors] || colors.MEDIUM
  }

  const isOverdue = (scheduledDate?: string) => {
    if (!scheduledDate) return false
    return new Date(scheduledDate) < new Date()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-brand-primary-text">
                  Assets in Maintenance
                </h2>
                <p className="text-sm text-gray-700 dark:text-brand-secondary-text mt-1">
                  {assets.length} asset{assets.length !== 1 ? 's' : ''} currently under maintenance
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {!loading && !error && assets.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-brand-primary-text">No assets in maintenance</h3>
                <p className="mt-1 text-sm text-gray-700 dark:text-brand-secondary-text">
                  All assets are currently available or in other states
                </p>
              </div>
            )}

            {!loading && !error && assets.length > 0 && (
              <div className="space-y-3">
                {assets.map((asset) => {
                  const activeRecord = asset.maintenanceRecords.find(r => r.status === 'IN_PROGRESS') || asset.maintenanceRecords[0]
                  const overdue = activeRecord?.scheduledDate ? isOverdue(activeRecord.scheduledDate) : false
                  
                  return (
                    <div key={asset.id} className={`bg-white dark:bg-white/5 rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                      overdue ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {/* Asset Image/Icon */}
                        <div className="flex-shrink-0">
                          {asset.imageUrl ? (
                            <img
                              src={asset.imageUrl}
                              alt={asset.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg flex items-center justify-center">
                              <span className="text-lg">🔧</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Asset Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-brand-primary-text truncate">
                                {asset.name}
                              </h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300 mt-1">
                                <span>{asset.category.replace('_', ' ')}</span>
                                {asset.serialNumber && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">{asset.serialNumber}</span>
                                  </>
                                )}
                                {(asset.currentValue || asset.purchasePrice) && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">${(asset.currentValue || asset.purchasePrice)?.toLocaleString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {overdue && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ml-2">
                                Overdue
                              </span>
                            )}
                          </div>
                          
                          {/* Maintenance Info - Compact */}
                          {activeRecord && (
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center space-x-2">
                                <span className="text-base" title={activeRecord.type}>
                                  {getMaintenanceTypeIcon(activeRecord.type)}
                                </span>
                                <span className="font-medium">{activeRecord.description}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(activeRecord.priority)}`}>
                                  {activeRecord.priority}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4">
                                {activeRecord.scheduledDate && (
                                  <span className={overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                    {new Date(activeRecord.scheduledDate).toLocaleDateString()}
                                  </span>
                                )}
                                {activeRecord.cost && (
                                  <span className="font-medium">
                                    ${activeRecord.cost.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex-shrink-0">
                          <Link
                            href={`/assets/${asset.id}`}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {assets.filter(asset => {
                  const activeRecord = asset.maintenanceRecords.find(r => r.status === 'IN_PROGRESS') || asset.maintenanceRecords[0]
                  return activeRecord?.scheduledDate ? isOverdue(activeRecord.scheduledDate) : false
                }).length} overdue • {assets.length} total in maintenance
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/assets?status=IN_MAINTENANCE"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  onClick={onClose}
                >
                  View in Assets Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}