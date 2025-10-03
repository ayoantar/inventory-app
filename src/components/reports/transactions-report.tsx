'use client'

import { useEffect, useState } from 'react'

interface DateRange {
  startDate: string
  endDate: string
}

interface TransactionData {
  id: string
  type: string
  status: string
  createdAt: string
  expectedReturnDate?: string
  actualReturnDate?: string
  notes?: string
  asset: {
    id: string
    name: string
    serialNumber?: string
    category: string
    manufacturer?: string
    model?: string
  }
  user?: {
    id: string
    name?: string
    email?: string
    department?: string
  }
}

interface TransactionsReportData {
  transactions: TransactionData[]
  summary: {
    total: number
    checkOuts: number
    checkIns: number
    active: number
    completed: number
  }
}

interface TransactionsReportProps {
  dateRange: DateRange
}

export default function TransactionsReport({ dateRange }: TransactionsReportProps) {
  const [data, setData] = useState<TransactionsReportData | null>(null)
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

      const response = await fetch(`/api/reports/transactions?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch transactions report:', error)
    } finally {
      setLoading(false)
    }
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
        <p className="text-white/50 hover:text-white/80 transition-colors">Failed to load transactions report</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-brand-primary-text">{data.summary.total}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Total Transactions</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{data.summary.checkOuts}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Check Outs</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-green-600">{data.summary.checkIns}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Check Ins</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.active}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Active</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-300">
          <div className="text-2xl font-bold text-white/50 hover:text-white/80 transition-colors">{data.summary.completed}</div>
          <div className="text-sm text-white/50 hover:text-white/80 transition-colors">Completed</div>
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
              <option value="CHECK_OUT">Check Out</option>
              <option value="CHECK_IN">Check In</option>
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
              <option value="ACTIVE">Active</option>
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

      {/* Transactions Table */}
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
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-brand-secondary-text uppercase tracking-wider">
                  Expected Return
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/5 divide-y divide-gray-300">
              {data.transactions.map((transaction) => (
                <tr key={transaction.id} className="hover">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-brand-primary-text">
                        {transaction.asset.name}
                      </div>
                      <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                        {transaction.asset.serialNumber || 'No S/N'} • {transaction.asset.category?.name || 'No Category'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      transaction.type === 'CHECK_OUT' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {transaction.type.replace('_', ' ')}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      transaction.status === 'ACTIVE'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : transaction.status === 'COMPLETED'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-800 text-gray-300 border border-gray-200'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {transaction.user?.name || 'Unknown User'}
                    </div>
                    {transaction.user?.department && (
                      <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                        {transaction.user.department}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-white/50 hover:text-white/80 transition-colors">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-brand-primary-text">
                      {transaction.expectedReturnDate 
                        ? new Date(transaction.expectedReturnDate).toLocaleDateString()
                        : '-'
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 hover:text-white/80 transition-colors">
              No transactions found for the selected criteria
            </div>
          </div>
        )}
      </div>
    </div>
  )
}