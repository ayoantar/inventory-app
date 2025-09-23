'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AnalyticsData {
  assetsByCategory: { name: string; value: number; color: string }[]
  assetsByStatus: { name: string; value: number; color: string }[]
  costTrends: { month: string; purchase: number; current: number }[]
  utilizationData: { asset: string; utilization: number }[]
}

interface MobileAnalyticsProps {
  data: AnalyticsData
}

export default function MobileAnalytics({ data }: MobileAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'utilization'>('overview')

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: '📊' },
    { id: 'trends' as const, name: 'Trends', icon: '📈' },
    { id: 'utilization' as const, name: 'Usage', icon: '⚡' }
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
          <p className="text-sm font-medium text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Asset Categories */}
      <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Assets by Category
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.assetsByCategory}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.assetsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Status */}
      <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Assets by Status
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.assetsByStatus} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.assetsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderTrends = () => (
    <div className="space-y-6">
      <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Cost Trends Over Time
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.costTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="purchase"
                stroke="#f97316"
                strokeWidth={3}
                name="Purchase Value"
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Current Value"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderUtilization = () => (
    <div className="space-y-6">
      <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          Asset Utilization
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.utilizationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asset" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value: number) => [`${value}%`, 'Utilization']}
              />
              <Bar
                dataKey="utilization"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  return (
    <div className="md:hidden">
      {/* Tab Navigation */}
      <div className="bg-gray-900/5 backdrop-blur-sm rounded-2xl p-2 mb-6 border border-gray-700">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center space-y-1 py-3 px-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                  : 'text-white/50 hover:text-white/80 transition-colors hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pb-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'trends' && renderTrends()}
        {activeTab === 'utilization' && renderUtilization()}
      </div>
    </div>
  )
}