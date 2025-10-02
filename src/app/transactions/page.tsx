'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import MobileTransactionCard from '@/components/transactions/mobile-transaction-card'
import { AssetTransaction } from '../../../generated/prisma'
import { getTransactionStatusColor, getTransactionTypeColor } from '@/lib/utils'

interface TransactionWithRelations extends AssetTransaction {
  asset: {
    id: string
    name: string
    serialNumber: string | null
    category: string
    status: string
  }
  user: { name: string | null; email: string | null } | null
}

interface TransactionsResponse {
  transactions: TransactionWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    type: ''
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchTransactions()
  }, [status, router, filter, pagination.page])

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filter.status && { status: filter.status }),
        ...(filter.type && { type: filter.type })
      })

      const response = await fetch(`/api/transactions?${params}`)
      if (response.ok) {
        const data: TransactionsResponse = await response.json()
        setTransactions(data.transactions)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleQuickReturn = async (transaction: TransactionWithRelations) => {
    if (confirm(`Return ${transaction.asset.name}?`)) {
      try {
        const response = await fetch(`/api/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId: transaction.asset.id,
            type: 'CHECK_IN',
            notes: `Quick return via mobile`,
            parentTransactionId: transaction.id
          })
        })

        if (response.ok) {
          fetchTransactions() // Refresh the list
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to return asset')
        }
      } catch (error) {
        console.error('Quick return failed:', error)
        alert('Failed to return asset')
      }
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark-blue via-gray-925 to-brand-black">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark-blue via-gray-925 to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            {/* Desktop Header */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Transactions
                </h1>
              </div>
              <p className="text-gray-800 dark:text-brand-secondary-text ml-11">
                Track asset check-ins and check-outs ({pagination.total} total)
              </p>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Transactions
                </h1>
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 712-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{pagination.total}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-brand-secondary-text">
                Asset check-ins and check-outs
              </p>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/5 rounded-lg border border-gray-700 text-left active:scale-95 touch-manipulation transition-all"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                <span className="text-sm font-medium text-brand-primary-text">
                  {Object.values(filter).some(value => value && value !== '')
                    ? 'Filters Applied'
                    : 'Show Filters'
                  }
                </span>
                {Object.values(filter).some(value => value && value !== '') && (
                  <span className="bg-brand-orange text-white text-xs px-2 py-0.5 rounded-full">
                    {Object.values(filter).filter(value => value && value !== '').length}
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                  filtersExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className={`bg-gray-900/5 rounded-lg border border-gray-700 p-4 md:p-6 mb-6 md:mb-8 ${filtersExpanded ? 'block' : 'hidden md:block'}`}>
            <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full md:w-auto border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 md:py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent touch-manipulation"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  id="type"
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full md:w-auto border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-3 md:py-2 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent touch-manipulation"
                >
                  <option value="">All Types</option>
                  <option value="CHECK_OUT">Check Out</option>
                  <option value="CHECK_IN">Check In</option>
                </select>
              </div>

              {(filter.status || filter.type) && (
                <div className="flex items-end md:col-span-2">
                  <button
                    onClick={() => {
                      setFilter({ status: '', type: '' })
                      setPagination(prev => ({ ...prev, page: 1 }))
                      setFiltersExpanded(false)
                    }}
                    className="w-full md:w-auto px-4 py-3 md:py-2 text-sm font-medium text-gray-700 dark:text-brand-secondary-text hover:text-gray-700 dark:hover:text-gray-300 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors active:scale-95 touch-manipulation"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile View - Transaction Cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((transaction) => (
              <MobileTransactionCard
                key={transaction.id}
                transaction={transaction}
                onQuickReturn={handleQuickReturn}
              />
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No transactions found</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-brand-secondary-text">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>

          {/* Desktop View - Transactions Table */}
          <div className="hidden md:block bg-gray-900/5 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-900/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      Expected Return
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-brand-secondary-text uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/5 divide-y divide-gray-300 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-white/10 dark:hover:bg-white/10 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <Link
                            href={`/assets/${transaction.asset.id}`}
                            className="text-sm font-medium text-brand-orange hover:text-blue-900"
                          >
                            {transaction.asset.name}
                          </Link>
                          <div className="text-xs text-gray-700 dark:text-brand-secondary-text">
                            {transaction.asset.serialNumber || 'No S/N'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getTransactionStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                          {transaction.user?.name || 'Unknown User'}
                        </div>
                      </td>
                      
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-700 dark:text-brand-secondary-text">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-brand-primary-text">
                          {transaction.expectedReturnDate 
                            ? new Date(transaction.expectedReturnDate).toLocaleDateString()
                            : '-'
                          }
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/assets/${transaction.asset.id}`}
                          className="text-brand-orange hover:text-blue-900 transition-colors"
                        >
                          View Asset
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-brand-primary-text">No transactions found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-brand-secondary-text">
                  {filter.status || filter.type 
                    ? 'Try adjusting your filters'
                    : 'Check out some assets to see transactions here'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {transactions.length > 0 && pagination.pages > 1 && (
            <div className="mt-6">
              {/* Desktop Pagination */}
              <div className="hidden md:flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/10 dark:hover:bg-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-900/5 text-gray-700 dark:text-gray-300">
                    {pagination.page} of {pagination.pages}
                  </span>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-white/10 dark:hover:bg-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Mobile Pagination */}
              <div className="md:hidden">
                <div className="text-center text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Page {pagination.page} of {pagination.pages} • {pagination.total} total
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="flex-1 px-4 py-3 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="flex-1 px-4 py-3 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}