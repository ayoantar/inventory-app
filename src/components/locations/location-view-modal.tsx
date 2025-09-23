'use client'

import { Dialog } from '@headlessui/react'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
  category: string
  status: string
  imageUrl?: string
}

interface AssetGroup {
  id: string
  name: string
  description?: string
  _count: {
    members: number
  }
}

interface Location {
  id: string
  name: string
  building: string | null
  floor: string | null
  room: string | null
  description: string | null
  capacity: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  assets?: Asset[]
  assetGroups?: AssetGroup[]
  _count?: {
    assets: number
    assetGroups: number
    assetTransactions: number
  }
}

interface LocationViewModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  location: Location | null
  canManage: boolean
  canDelete: boolean
}

export default function LocationViewModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  location,
  canManage,
  canDelete
}: LocationViewModalProps) {
  if (!location) return null

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <Dialog.Title className="text-xl font-semibold text-brand-primary-text">
                  {location.name}
                </Dialog.Title>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  location.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-brand-primary-text'
                }`}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {canManage && (
                  <button
                    onClick={onEdit}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 hover text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={onDelete}
                    className="inline-flex items-center px-3 py-2 bg-red-600 hover text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-white/50 hover:text-white/80 transition-colors hover transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Location Details */}
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary-text mb-4">
                    Location Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/5/50 rounded-lg p-4">
                    <div>
                      <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Building</label>
                      <p className="text-brand-primary-text">{location.building || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Floor</label>
                      <p className="text-brand-primary-text">{location.floor || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Room</label>
                      <p className="text-brand-primary-text">{location.room || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Capacity</label>
                      <p className="text-brand-primary-text">{location.capacity || '-'}</p>
                    </div>
                    {location.description && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors">Description</label>
                        <p className="text-brand-primary-text">{location.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assets Preview */}
                {location.assets && location.assets.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-brand-primary-text">
                        Assets ({location.assets.length})
                      </h3>
                      <Link
                        href={`/assets?location=${encodeURIComponent(location.name)}`}
                        className="text-blue-600 hover text-sm font-medium"
                        onClick={onClose}
                      >
                        View All →
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {location.assets.slice(0, 6).map((asset) => (
                        <Link
                          key={asset.id}
                          href={`/assets/${asset.id}`}
                          onClick={onClose}
                          className="flex items-center p-3 bg-gray-900/5/50 rounded-lg hover transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-brand-primary-text truncate">
                              {asset.name}
                            </p>
                            <p className="text-sm text-white/50 hover:text-white/80 transition-colors">
                              {asset.category} • {asset.status}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary-text mb-4">
                    Statistics
                  </h3>
                  <div className="bg-gray-900/5/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 hover:text-white/80 transition-colors">Assets</span>
                      <span className="font-semibold text-brand-primary-text">
                        {location._count?.assets || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 hover:text-white/80 transition-colors">Asset Groups</span>
                      <span className="font-semibold text-brand-primary-text">
                        {location._count?.assetGroups || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 hover:text-white/80 transition-colors">Transactions</span>
                      <span className="font-semibold text-brand-primary-text">
                        {location._count?.assetTransactions || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-brand-primary-text mb-4">
                    Timestamps
                  </h3>
                  <div className="bg-gray-900/5/50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm text-white/50 hover:text-white/80 transition-colors">Created</span>
                      <p className="text-sm text-brand-primary-text">
                        {new Date(location.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-white/50 hover:text-white/80 transition-colors">Last Updated</span>
                      <p className="text-sm text-brand-primary-text">
                        {new Date(location.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}