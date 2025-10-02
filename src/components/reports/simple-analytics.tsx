'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

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

interface SimpleAnalyticsProps {
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
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400'
  }

  return (
    <div className="bg-gray-900/40 rounded-lg border border-gray-600 p-6">
      <div className="flex items-center">
        <div className={`bg-gray-800/80 p-3 rounded-lg ${colorClasses[color]} mr-4`}>
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

function SimpleBarChart({ data, title }: { data: any[], title: string }) {
  console.log('SimpleBarChart received:', { data, title, dataType: typeof data, isArray: Array.isArray(data) })

  if (!data || data.length === 0) {
    console.log('No data for chart:', title)
    return (
      <div className="bg-gray-900/40 rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
        <div className="h-80 bg-gray-900/60 rounded border border-gray-700 flex items-center justify-center">
          <p className="text-brand-secondary-text">No data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((item, index) => {
    console.log('Raw item before mapping:', item)
    const mappedItem = {
      name: item.label || item.name || `Item ${index}`,
      value: Number(item.count || item.value || 0),
      fill: COLORS[index % COLORS.length]
    }
    console.log('Mapped item:', item, '->', mappedItem)
    return mappedItem
  })

  console.log('Final chartData for', title, ':', chartData)

  return (
    <div className="bg-gray-900/40 rounded-lg border border-gray-600 p-6">
      <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>

      {/* Debug info */}
      <div className="mb-4 p-3 bg-gray-900/60 rounded border border-gray-700 text-xs">
        <p className="text-green-400 mb-1">Debug - Raw data length: {data.length}</p>
        <p className="text-blue-400">Chart data: {JSON.stringify(chartData.slice(0, 3), null, 1)}</p>
      </div>

      <div className="h-80 bg-gray-900/60 rounded border border-gray-700">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320} style={{ backgroundColor: 'transparent' }}>
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
              style={{ backgroundColor: 'transparent' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                type="number"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                axisLine={{ stroke: '#9CA3AF' }}
                tickLine={{ stroke: '#9CA3AF' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9CA3AF"
                width={90}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                axisLine={{ stroke: '#9CA3AF' }}
                tickLine={{ stroke: '#9CA3AF' }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)'
                }}
                labelStyle={{ color: '#FFFFFF' }}
                itemStyle={{ color: '#FFFFFF' }}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                style={{ outline: 'none' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-brand-secondary-text">Chart data is empty</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SimpleAnalytics({ dateRange }: SimpleAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate)

      console.log('Fetching analytics with params:', params.toString())
      const response = await fetch(`/api/reports/analytics?${params}`)

      if (response.ok) {
        const data = await response.json()
        console.log('Analytics API response:', data)
        setAnalytics(data)
      } else {
        console.error('Analytics API error:', response.status, response.statusText)
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
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
          <p className="text-red-400">{error || 'Failed to load analytics'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Daily Activity (Last 7 Days)</h3>
          <div className="h-80 bg-gray-900/60 rounded border border-gray-700">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.activity.trends}
                margin={{ top: 20, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={30}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.8)'
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString()
                  }}
                />
                <Bar dataKey="checkouts" name="Check-outs" fill="#EF4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="checkins" name="Check-ins" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-900/40 rounded-lg border border-gray-600 p-6">
          <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Recent Activity by User</h3>
          <div className="h-80 bg-gray-900/60 rounded border border-gray-700 overflow-auto">
            <div className="p-2 space-y-2">
              {analytics.activity.recentTransactions && analytics.activity.recentTransactions.length > 0 ? (
                analytics.activity.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between py-1 px-2 bg-gray-800/60 rounded border border-gray-600">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'CHECK_OUT' ? 'bg-red-400' : 'bg-green-400'
                        }`}></div>
                        <span className="text-brand-secondary-text text-sm">
                          {transaction.type === 'CHECK_OUT' ? 'Checked out by' : 'Checked in by'}
                        </span>
                        <span className="text-brand-primary-text font-medium">
                          {transaction.userName}
                        </span>
                      </div>
                      <div className="text-brand-secondary-text text-sm mt-1">
                        {transaction.assetName}
                      </div>
                    </div>
                    <div className="text-brand-secondary-text text-xs">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-brand-secondary-text py-4">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}