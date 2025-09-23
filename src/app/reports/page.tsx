'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/navbar'
import SimpleAnalytics from '@/components/reports/simple-analytics'
import TransactionsReport from '@/components/reports/transactions-report'
import MaintenanceReport from '@/components/reports/maintenance-report'
import ClientAssetsReport from '@/components/reports/client-assets-report'

type ReportTab = 'analytics' | 'transactions' | 'maintenance' | 'clients'

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ReportTab>('analytics')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Set default date range based on selected period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (selectedPeriod) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })
  }, [status, router, selectedPeriod])

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
    setSelectedPeriod('custom') // Set to custom when user manually changes dates
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const response = await fetch(`/api/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `inventory-report-${dateRange.startDate}-to-${dateRange.endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-primary-text">Reports & Analytics</h1>
              <p className="text-sm sm:text-base text-brand-primary-text">
                Comprehensive insights into your inventory performance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => exportReport('excel')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="text-lg font-medium text-brand-primary-text mb-2">Report Period</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: '7d', label: 'Last 7 days' },
                    { key: '30d', label: 'Last 30 days' },
                    { key: '90d', label: 'Last 90 days' },
                    { key: '1y', label: 'Last year' },
                    { key: 'custom', label: 'Custom range' }
                  ].map((period) => (
                    <button
                      key={period.key}
                      onClick={() => setSelectedPeriod(period.key)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedPeriod === period.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-900/5 text-gray-300 hover'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="border border-gray-600 rounded-md px-3 py-2 bg-white/5 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="border border-gray-600 rounded-md px-3 py-2 bg-white/5 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Tabs */}
          <div>
            <div className="border-b border-gray-700">
              <nav className="-mb-px flex flex-wrap gap-2 sm:gap-8">
                {[
                  { key: 'analytics', label: 'Analytics', icon: '📊' },
                  { key: 'transactions', label: 'Transactions', icon: '🔄' },
                  { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
                  { key: 'clients', label: 'Client Assets', icon: '👥' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as ReportTab)}
                    className={`py-2 px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-white/50 hover:text-white/80 transition-colors hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Report Content */}
          <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
            <SimpleAnalytics dateRange={dateRange} />
          </div>
          <div className={activeTab === 'transactions' ? 'block' : 'hidden'}>
            <TransactionsReport dateRange={dateRange} />
          </div>
          <div className={activeTab === 'maintenance' ? 'block' : 'hidden'}>
            <MaintenanceReport dateRange={dateRange} />
          </div>
          <div className={activeTab === 'clients' ? 'block' : 'hidden'}>
            <ClientAssetsReport />
          </div>
        </div>
      </div>
    </div>
  )
}