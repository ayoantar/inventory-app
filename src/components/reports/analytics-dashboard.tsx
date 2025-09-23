'use client'

import { useState, useEffect } from 'react'
import { PieChartComponent, BarChartComponent, LineChartComponent, MultiBarChartComponent } from './chart-components'

interface AnalyticsData {
  overview: {
    totalAssets: number
    totalValue: number
    checkedOutAssets: number
    availableAssets: number
    utilizationRate: number
    recentTransactions: number
    overdueAssets: number
  }
  assets: {
    byCategory: Array<{ category: string; count: number; label: string }>
    byStatus: Array<{ status: string; count: number; label: string }>
  }
  activity: {
    trends: Array<{ date: string; checkouts: number; checkins: number }>
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
    blue: 'text-blue-400 hover:text-blue-300',
    green: 'text-emerald-400 hover:text-emerald-300',
    yellow: 'text-amber-400 hover:text-amber-300',
    red: 'text-red-400 hover:text-red-300',
    purple: 'text-purple-400 hover:text-purple-300'
  }

  return (
    <div className="bg-gray-900/5 rounded-lg border border-gray-600 p-6">
      <div className="flex items-center">
        <div className={`bg-white/5 hover:bg-white/10 p-3 rounded-lg transition-colors ${colorClasses[color]} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-brand-secondary-text">{title}</p>
          <p className="text-2xl font-bold text-brand-primary-text">{value}</p>
          {subtitle && (
            <p className="text-sm text-brand-secondary-text">{subtitle}</p>
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
        console.log('Analytics data received:', data)
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
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/10 border border-red-600/50 rounded-lg p-6">
          <p className="text-red-400">{error || 'Failed to load analytics'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Core Stats - 6 focused metrics */}
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
          subtitle="Current inventory value"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />

        <StatCard
          title="Checked Out"
          value={analytics.overview.checkedOutAssets}
          subtitle={`${analytics.overview.utilizationRate}% utilization`}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        />

        <StatCard
          title="Available"
          value={analytics.overview.availableAssets}
          subtitle="Ready for checkout"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Recent Activity"
          value={analytics.overview.recentTransactions}
          subtitle="Transactions this week"
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatCard
          title="Overdue"
          value={analytics.overview.overdueAssets}
          subtitle="Need immediate attention"
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Essential Charts - Maximum 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Category */}
        <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Assets by Category (Debug)</h3>
          <div className="mb-4 p-4 bg-gray-900 border border-gray-600 rounded text-xs">
            <p className="text-green-400 mb-2">Raw API data:</p>
            <div className="bg-gray-800 p-2 rounded border border-gray-700 overflow-auto max-h-40">
              <code className="text-green-300 whitespace-pre text-xs">
                {JSON.stringify(analytics.assets.byCategory, null, 2)}
              </code>
            </div>
            <p className="text-blue-400 mt-4 mb-2">Chart data (mapped):</p>
            <div className="bg-gray-800 p-2 rounded border border-gray-700 overflow-auto max-h-40">
              <code className="text-blue-300 whitespace-pre text-xs">
                {JSON.stringify(analytics.assets.byCategory.map(item => ({
                  label: item.label,
                  value: item.count
                })), null, 2)}
              </code>
            </div>
          </div>
          <PieChartComponent
            data={analytics.assets.byCategory.map(item => {
              console.log('Category data:', item)
              return {
                label: item.label,
                value: item.count
              }
            })}
            title="Assets by Category (Real Data)"
          />

          <div className="mt-4 border-t border-gray-600 pt-4">
            <p className="text-yellow-400 text-sm mb-2">Test with hardcoded data:</p>
            <PieChartComponent
              data={[
                { label: "Camera Equipment", value: 25 },
                { label: "Audio Equipment", value: 15 },
                { label: "Lighting", value: 10 },
                { label: "Video Editing", value: 8 }
              ]}
              title="Test Chart (Hardcoded Data)"
            />
          </div>
        </div>

        {/* Asset Status Distribution */}
        <PieChartComponent
          data={analytics.assets.byStatus.map(item => ({
            label: item.label,
            value: item.count
          }))}
          title="Asset Status Distribution"
        />
      </div>

      {/* Activity Trends - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <MultiBarChartComponent
          data={analytics.activity.trends}
          title="Check-in/Check-out Activity (Last 7 Days)"
          xAxisKey="date"
          bars={[
            { key: 'checkouts', name: 'Check-outs', color: '#EF4444' },
            { key: 'checkins', name: 'Check-ins', color: '#10B981' }
          ]}
        />
      </div>
    </div>
  )
}