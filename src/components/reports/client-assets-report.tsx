'use client'

import { useEffect, useState } from 'react'
import { formatCategory, formatStatus } from '@/lib/utils'

interface ClientData {
  id: string
  name: string
  code: string
  description?: string
  contact?: string
  email?: string
  isActive: boolean
  assets: {
    id: string
    name: string
    serialNumber?: string
    category: string
    status: string
    condition: string
    manufacturer?: string
    model?: string
    location?: string
    purchasePrice?: number
    currentValue?: number
    purchaseDate?: string
    createdAt: string
  }[]
  stats: {
    totalAssets: number
    totalValue: number
    totalPurchaseValue: number
    categoryBreakdown: Record<string, number>
    statusBreakdown: Record<string, number>
  }
}

interface ClientAssetsReportData {
  clients: ClientData[]
  summary: {
    totalClients: number
    totalAssets: number
    totalValue: number
    totalPurchaseValue: number
    statusBreakdown: {
      available: number
      checkedOut: number
      inMaintenance: number
      retired: number
    }
  }
}

export default function ClientAssetsReport() {
  const [data, setData] = useState<ClientAssetsReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState('')
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [selectedClient])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(selectedClient && { clientId: selectedClient })
      })

      const response = await fetch(`/api/reports/clients?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch client assets report:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50 hover:text-white/80 transition-colors">Failed to load client assets report</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-brand-primary-text">{data.summary.totalClients}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Active Clients</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{data.summary.totalAssets}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Total Assets</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalValue)}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Current Value</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-white/50 hover:text-white/80 transition-colors">{formatCurrency(data.summary.totalPurchaseValue)}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Purchase Value</div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-green-600">{data.summary.statusBreakdown.available}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Available</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.statusBreakdown.checkedOut}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Checked Out</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-red-600">{data.summary.statusBreakdown.inMaintenance}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">In Maintenance</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-white/50 hover:text-white/80 transition-colors">{data.summary.statusBreakdown.retired}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Retired</div>
        </div>
      </div>

      {/* Client Filter */}
      <div className="bg-gray-900/5 rounded-lg border border-gray-300 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
              Filter by Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-brand-dark-blue text-brand-primary-text"
            >
              <option value="">All Clients</option>
              {data.clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.code})
                </option>
              ))}
            </select>
          </div>

          {selectedClient && (
            <div className="flex items-end">
              <button
                onClick={() => setSelectedClient('')}
                className="text-white/50 hover:text-white/80 transition-colors hover text-sm px-3 py-2"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {data.clients.map((client) => (
          <div key={client.id} className="bg-gray-900 rounded-lg border border-gray-300 overflow-hidden">
            {/* Client Header */}
            <div 
              className="p-4 border-b border-gray-300 cursor-pointer hover"
              onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-brand-primary-text">
                    {client.name} ({client.code})
                  </h3>
                  {client.description && (
                    <p className="text-sm text-white/50 hover:text-white/80 transition-colors">{client.description}</p>
                  )}
                  {client.contact && (
                    <p className="text-sm text-white/50 hover:text-white/80 transition-colors">
                      Contact: {client.contact} {client.email && `(${client.email})`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-medium text-brand-primary-text">
                    {client.stats.totalAssets} assets
                  </div>
                  <div className="text-sm text-white/50 hover:text-white/80 transition-colors">
                    {formatCurrency(client.stats.totalValue)}
                  </div>
                  <div className="text-xs text-white/50 hover:text-white/80 transition-colors mt-1">
                    {expandedClient === client.id ? '▲ Hide Details' : '▼ Show Details'}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Client Details */}
            {expandedClient === client.id && (
              <div className="p-4 bg-gray-900/5">
                {/* Client Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-brand-primary-text">
                      {formatCurrency(client.stats.totalValue)}
                    </div>
                    <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Current Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-brand-primary-text">
                      {formatCurrency(client.stats.totalPurchaseValue)}
                    </div>
                    <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Purchase Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {Object.keys(client.stats.categoryBreakdown).length}
                    </div>
                    <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {client.stats.statusBreakdown.AVAILABLE || 0}
                    </div>
                    <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Available</div>
                  </div>
                </div>

                {/* Assets Table */}
                <div className="bg-gray-900 rounded-lg border border-gray-300 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-300">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                            Asset
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                            Condition
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900/5 divide-y divide-gray-300">
                        {client.assets.map((asset) => (
                          <tr key={asset.id} className="hover">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-brand-primary-text">
                                  {asset.name}
                                </div>
                                <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                                  {asset.serialNumber || 'No S/N'}
                                </div>
                                {asset.manufacturer && asset.model && (
                                  <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                                    {asset.manufacturer} {asset.model}
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-200">
                                {formatCategory(asset.category)}
                              </span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                asset.status === 'AVAILABLE'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : asset.status === 'CHECKED_OUT'
                                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                  : asset.status === 'IN_MAINTENANCE'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-800 text-gray-300 border border-gray-200'
                              }`}>
                                {formatStatus(asset.status)}
                              </span>
                            </td>
                            
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                asset.condition === 'EXCELLENT'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : asset.condition === 'GOOD'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : asset.condition === 'FAIR'
                                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {asset.condition}
                              </span>
                            </td>
                            
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-brand-primary-text">
                                {asset.currentValue ? formatCurrency(asset.currentValue) : '-'}
                              </div>
                              {asset.purchasePrice && asset.purchasePrice !== asset.currentValue && (
                                <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                                  Orig: {formatCurrency(asset.purchasePrice)}
                                </div>
                              )}
                            </td>
                            
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-brand-primary-text">
                                {asset.location || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {client.assets.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-white/50 hover:text-white/80 transition-colors">
                        No assets found for this client
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.clients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-white/50 hover:text-white/80 transition-colors">
            No clients found
          </div>
        </div>
      )}
    </div>
  )
}