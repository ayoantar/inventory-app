'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts'

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

interface ChartData {
  label: string
  value: number
  count?: number
}

interface HorizontalBarChartProps {
  data: ChartData[]
  title: string
  dataKey?: string
  nameKey?: string
}

export function HorizontalBarChartComponent({ data, title, dataKey = 'value', nameKey = 'label' }: HorizontalBarChartProps) {
  console.log('Chart component received data:', data, 'title:', title)

  if (!data || data.length === 0) {
    console.log('No data provided to chart:', data)
    return (
      <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
        <div className="min-h-[350px] flex items-center justify-center">
          <p className="text-brand-secondary-text">No data available</p>
        </div>
      </div>
    )
  }

  // Convert pie chart data to horizontal bar chart format
  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }))

  console.log('Chart data transformed:', chartData)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  console.log('Total value:', total)

  return (
    <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
      <div className="min-h-[350px] bg-transparent [&_.recharts-wrapper]:bg-transparent [&_.recharts-surface]:bg-transparent">
        <ResponsiveContainer width="100%" height={350} style={{ backgroundColor: 'transparent' }}>
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          style={{ backgroundColor: 'transparent' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            type="number"
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={{ stroke: '#6B7280' }}
            axisLine={{ stroke: '#6B7280' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={{ stroke: '#6B7280' }}
            axisLine={{ stroke: '#6B7280' }}
            width={80}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              const percent = ((value / total) * 100).toFixed(1)
              return [`${value} (${percent}%)`, 'Count']
            }}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid #6B7280',
              borderRadius: '8px',
              color: '#ffffff',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            cursor={{ fill: 'transparent' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Clean bar chart component (no pie chart references)
export function CategoryBarChart({ data, title }: { data: ChartData[], title: string }) {
  console.log('CategoryBarChart received data:', data, 'title:', title)

  if (!data || data.length === 0) {
    console.log('No data provided to CategoryBarChart:', data)
    return (
      <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
        <div className="min-h-[350px] flex items-center justify-center">
          <p className="text-brand-secondary-text">No data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }))

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
      <div className="min-h-[350px] bg-transparent">
        <ResponsiveContainer width="100%" height={350} style={{ backgroundColor: 'transparent' }}>
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            style={{ backgroundColor: 'transparent' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              type="number"
              stroke="#6B7280"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
              axisLine={{ stroke: '#6B7280' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6B7280"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={{ stroke: '#6B7280' }}
              axisLine={{ stroke: '#6B7280' }}
              width={80}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                const percent = ((value / total) * 100).toFixed(1)
                return [`${value} (${percent}%)`, 'Count']
              }}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid #6B7280',
                borderRadius: '8px',
                color: '#ffffff',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#ffffff' }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              cursor={{ fill: 'transparent' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// For backward compatibility
export function PieChartComponent(props: { data: ChartData[], title: string }) {
  return <CategoryBarChart {...props} />
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
    <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
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
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid #6B7280',
              borderRadius: '8px',
              color: '#ffffff',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
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
    <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
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
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid #6B7280',
              borderRadius: '8px',
              color: '#ffffff',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
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
    <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-brand-primary-text mb-4">{title}</h3>
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
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid #6B7280',
              borderRadius: '8px',
              color: '#ffffff',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Legend
            wrapperStyle={{
              color: '#ffffff',
              fontSize: '14px'
            }}
          />
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