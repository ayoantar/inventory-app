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
      
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Desktop Header */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Reports & Analytics
                  </h1>
                </div>
                <p className="text-base text-gray-600 dark:text-brand-secondary-text ml-11 max-w-2xl">
                  Comprehensive insights into your inventory performance and trends
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportReport('excel')}
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Reports
              </h1>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-brand-secondary-text mb-4">
              Comprehensive insights and analytics
            </p>

            {/* Mobile Export Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => exportReport('excel')}
                className="flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-medium text-brand-primary-text mb-2 sm:mb-3">Report Period</h3>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {[
                    { key: '7d', label: '7 days', fullLabel: 'Last 7 days' },
                    { key: '30d', label: '30 days', fullLabel: 'Last 30 days' },
                    { key: '90d', label: '90 days', fullLabel: 'Last 90 days' },
                    { key: '1y', label: '1 year', fullLabel: 'Last year' },
                    { key: 'custom', label: 'Custom', fullLabel: 'Custom range' }
                  ].map((period) => (
                    <button
                      key={period.key}
                      onClick={() => setSelectedPeriod(period.key)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 touch-manipulation ${
                        selectedPeriod === period.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="sm:hidden">{period.label}</span>
                      <span className="hidden sm:inline">{period.fullLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-3 md:py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-3 md:py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Report Tabs */}
          <div>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px grid grid-cols-2 sm:flex gap-0 sm:gap-4">
                {[
                  { key: 'analytics', label: 'Analytics', shortLabel: 'Analytics', icon: '📊' },
                  { key: 'transactions', label: 'Transactions', shortLabel: 'Trans.', icon: '🔄' },
                  { key: 'maintenance', label: 'Maintenance', shortLabel: 'Maint.', icon: '🔧' },
                  { key: 'clients', label: 'Client Assets', shortLabel: 'Clients', icon: '👥' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as ReportTab)}
                    className={`py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors active:scale-95 touch-manipulation ${
                      activeTab === tab.key
                        ? 'border-brand-orange text-brand-orange'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-brand-primary-text hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-center sm:justify-start">
                      <span className="text-sm sm:text-base mr-1 sm:mr-2">{tab.icon}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Report Content */}
          <div className="min-h-96">
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
    </div>
  )
}