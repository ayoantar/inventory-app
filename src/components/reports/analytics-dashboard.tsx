'use client'

import { useState, useEffect } from 'react'
import { PieChartComponent, BarChartComponent, LineChartComponent, MultiBarChartComponent } from './chart-components'

interface AnalyticsData {
  overview: {
    totalAssets: number
    totalValue: number
    totalPurchaseValue: number
    recentTransactions: number
    utilizationRate: number
    maintenanceCostPerAsset: number
  }
  assets: {
    byCategory: Array<{ category: string; count: number; label: string }>
    byStatus: Array<{ status: string; count: number; label: string }>
    byCondition: Array<{ condition: string; count: number; label: string }>
  }
  financial: {
    categoryValues: Array<{
      category: string
      currentValue: number
      purchaseValue: number
      count: number
      label: string
    }>
    totalCurrentValue: number
    totalPurchaseValue: number
    depreciation: number
  }
  maintenance: {
    byStatus: Array<{
      status: string
      count: number
      cost: number
      label: string
    }>
    totalCost: number
    averageCostPerAsset: number
  }
  activity: {
    transactions: Array<{ type: string; count: number; label: string }>
    topUsers: Array<{
      userId: string
      transactionCount: number
      userName: string
      userEmail: string | null
    }>
    trends: Array<{ date: string; transactions: number }>
  }
}

interface AnalyticsDashboardProps {
  dateRange?: {
    startDate: string
    endDate: string
  }
}

function StatCard({ title, value, subtitle, icon, color = 'blue' }: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    yellow: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
  }

  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-brand-dark-blue-deep p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-brand-secondary-text">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-brand-primary-text">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-700 dark:text-brand-secondary-text">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ dateRange }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/reports/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        setError('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Analytics fetch error:', error)
      setError('An error occurred while fetching analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <p className="text-red-800 dark:text-red-200">{error || 'Failed to load analytics'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Assets"
          value={(analytics.overview.totalAssets || 0).toLocaleString()}
          subtitle="Assets in inventory"
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        
        <StatCard
          title="Total Value"
          value={`$${(analytics.overview.totalValue || 0).toLocaleString()}`}
          subtitle={`Purchase: $${(analytics.overview.totalPurchaseValue || 0).toLocaleString()}`}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        
        <StatCard
          title="Utilization Rate"
          value={`${analytics.overview.utilizationRate}%`}
          subtitle="Assets currently in use"
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Recent Activity"
          value={analytics.overview.recentTransactions}
          subtitle="Transactions this period"
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        
        <StatCard
          title="Maintenance Cost"
          value={`$${(analytics.maintenance.totalCost || 0).toLocaleString()}`}
          subtitle={`$${(analytics.overview.maintenanceCostPerAsset || 0).toFixed(2)} per asset`}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Depreciation"
          value={`$${(analytics.financial.depreciation || 0).toLocaleString()}`}
          subtitle="Value lost over time"
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution */}
        <PieChartComponent
          data={analytics.assets.byCategory.map(item => ({
            label: item.label,
            value: item.count
          }))}
          title="Assets by Category"
        />
        
        <PieChartComponent
          data={analytics.assets.byStatus.map(item => ({
            label: item.label,
            value: item.count
          }))}
          title="Assets by Status"
        />
        
        <BarChartComponent
          data={analytics.assets.byCondition.map(item => ({
            condition: item.label,
            count: item.count
          }))}
          title="Assets by Condition"
          xAxisKey="condition"
          yAxisKey="count"
          color="#10B981"
        />
        
        <LineChartComponent
          data={analytics.activity.trends}
          title="Activity Trends (Last 7 Days)"
          xAxisKey="date"
          yAxisKey="transactions"
          color="#8B5CF6"
        />
      </div>

      {/* Financial Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <MultiBarChartComponent
          data={analytics.financial.categoryValues.map(item => ({
            category: item.label,
            currentValue: item.currentValue,
            purchaseValue: item.purchaseValue
          }))}
          title="Asset Values by Category"
          xAxisKey="category"
          bars={[
            { key: 'purchaseValue', name: 'Purchase Value', color: '#3B82F6' },
            { key: 'currentValue', name: 'Current Value', color: '#10B981' }
          ]}
        />
      </div>

      {/* Maintenance & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-brand-dark-blue-deep p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text mb-4">Maintenance Status</h3>
          <div className="space-y-3">
            {analytics.maintenance.byStatus.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-brand-primary-text capitalize">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                    {item.count} records
                  </div>
                  <div className="text-xs text-gray-700 dark:text-brand-secondary-text">
                    ${(item.cost || 0).toLocaleString()} spent
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-brand-dark-blue-deep p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {analytics.activity.topUsers.slice(0, 5).map((user, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-brand-primary-text">
                    {user.userName}
                  </div>
                  <div className="text-xs text-gray-700 dark:text-brand-secondary-text">
                    {user.userEmail}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {user.transactionCount} transactions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}