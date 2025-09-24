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
          {/* Header */}
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-brand-primary-text">Reports & Analytics</h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-brand-secondary-text mt-1">
                  Comprehensive insights into your inventory performance
                </p>
              </div>

              <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => exportReport('excel')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium inline-flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Export </span>Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium inline-flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Export </span>PDF
                </button>
              </div>
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
                  <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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