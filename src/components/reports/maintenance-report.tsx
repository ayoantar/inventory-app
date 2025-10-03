'use client'

import { useEffect, useState } from 'react'
import { formatStatus } from '@/lib/utils'

interface DateRange {
  startDate: string
  endDate: string
}

interface MaintenanceData {
  id: string
  type: string
  status: string
  description: string
  scheduledDate: string
  completedDate?: string
  performedDate?: string
  cost?: number
  actualCost?: number
  notes?: string
  completionNotes?: string
  nextMaintenanceDate?: string
  asset: {
    id: string
    name: string
    serialNumber?: string
    category: string
    manufacturer?: string
    model?: string
    location?: string
  }
  createdBy?: {
    id: string
    name?: string
    email?: string
    department?: string
  }
  performedBy?: {
    id: string
    name?: string
    email?: string
    department?: string
  }
}

interface MaintenanceReportData {
  maintenanceRecords: MaintenanceData[]
  summary: {
    total: number
    scheduled: number
    inProgress: number
    completed: number
    overdue: number
    totalEstimatedCost: number
    totalActualCost: number
    costVariance: number
  }
}

interface MaintenanceReportProps {
  dateRange: DateRange
}

export default function MaintenanceReport({ dateRange }: MaintenanceReportProps) {
  const [data, setData] = useState<MaintenanceReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    type: '',
    status: ''
  })

  useEffect(() => {
    fetchData()
  }, [dateRange, filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
        ...(filter.type && { type: filter.type }),
        ...(filter.status && { status: filter.status })
      })

      const response = await fetch(`/api/reports/maintenance?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch maintenance report:', error)
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
        <p className="text-white/50 hover:text-white/80 transition-colors">Failed to load maintenance report</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-brand-primary-text">{data.summary.total}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Total Records</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{data.summary.scheduled}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Scheduled</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-green-600">{data.summary.completed}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Completed</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-red-600">{data.summary.overdue}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Overdue</div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-brand-primary-text">
            {formatCurrency(data.summary.totalEstimatedCost)}
          </div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Estimated Cost</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-brand-primary-text">
            {formatCurrency(data.summary.totalActualCost)}
          </div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Actual Cost</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className={`text-2xl font-bold ${
            data.summary.costVariance >= 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(data.summary.costVariance))}
          </div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">
            {data.summary.costVariance >= 0 ? 'Over Budget' : 'Under Budget'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/5 rounded-lg border border-gray-300 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
              Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 bg-brand-dark-blue text-brand-primary-text"
            >
              <option value="">All Types</option>
              <option value="PREVENTIVE">Preventive</option>
              <option value="CORRECTIVE">Corrective</option>
              <option value="INSPECTION">Inspection</option>
              <option value="CALIBRATION">Calibration</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 bg-brand-dark-blue text-brand-primary-text"
            >
              <option value="">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {(filter.type || filter.status) && (
            <div className="flex items-end">
              <button
                onClick={() => setFilter({ type: '', status: '' })}
                className="text-white/50 hover:text-white/80 transition-colors hover text-sm px-3 py-2"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-300">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/5 divide-y divide-gray-300">
              {data.maintenanceRecords.map((record) => (
                <tr key={record.id} className="hover">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-brand-primary-text">
                        {record.asset.name}
                      </div>
                      <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                        {record.asset.serialNumber || 'No S/N'} • {record.asset.category?.name || 'No Category'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-200">
                      {record.type.replace('_', ' ')}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      record.status === 'SCHEDULED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : record.status === 'IN_PROGRESS'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : record.status === 'COMPLETED'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-800 text-gray-300 border border-gray-200'
                    }`}>
                      {formatStatus(record.status)}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {new Date(record.scheduledDate).toLocaleDateString()}
                    </div>
                    {record.status === 'SCHEDULED' && new Date(record.scheduledDate) < new Date() && (
                      <div className="text-xs text-red-500">Overdue</div>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {record.actualCost ? formatCurrency(record.actualCost) : 
                       record.cost ? formatCurrency(record.cost) : '-'}
                    </div>
                    {record.cost && record.actualCost && record.cost !== record.actualCost && (
                      <div className={`text-xs ${record.actualCost > record.cost ? 'text-red-500' : 'text-green-500'}`}>
                        Est: {formatCurrency(record.cost)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="text-sm text-brand-primary-text max-w-xs truncate">
                      {record.description}
                    </div>
                    {record.performedBy && (
                      <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                        By: {record.performedBy.name}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.maintenanceRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 hover:text-white/80 transition-colors">
              No maintenance records found for the selected criteria
            </div>
          </div>
        )}
      </div>
    </div>
  )
}