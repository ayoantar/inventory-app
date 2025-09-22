'use client'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

interface ChartData {
  label: string
  value: number
  count?: number
}

interface PieChartComponentProps {
  data: ChartData[]
  title: string
  dataKey?: string
  nameKey?: string
}

export function PieChartComponent({ data, title, dataKey = 'value', nameKey = 'label' }: PieChartComponentProps) {
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)
    return `${percent}%`
  }

  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [value, name]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-gray-600 dark:text-gray-300 capitalize">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface BarChartComponentProps {
  data: any[]
  title: string
  xAxisKey: string
  yAxisKey: string
  color?: string
}

export function BarChartComponent({ data, title, xAxisKey, yAxisKey, color = '#3B82F6' }: BarChartComponentProps) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Bar dataKey={yAxisKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LineChartComponentProps {
  data: any[]
  title: string
  xAxisKey: string
  yAxisKey: string
  color?: string
}

export function LineChartComponent({ data, title, xAxisKey, yAxisKey, color = '#10B981' }: LineChartComponentProps) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getMonth() + 1}/${date.getDate()}`
            }}
          />
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} />
          <Tooltip 
            labelFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString()
            }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey={yAxisKey} 
            stroke={color} 
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MultiBarChartProps {
  data: any[]
  title: string
  xAxisKey: string
  bars: { key: string; name: string; color: string }[]
}

export function MultiBarChartComponent({ data, title, xAxisKey, bars }: MultiBarChartProps) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#6B7280"
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} />
          <Tooltip 
            formatter={(value: any, name: any) => [
              typeof value === 'number' && name.includes('Value') 
                ? `$${value.toLocaleString()}` 
                : value,
              name
            ]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar 
              key={bar.key}
              dataKey={bar.key} 
              name={bar.name}
              fill={bar.color} 
              radius={[2, 2, 0, 0]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}