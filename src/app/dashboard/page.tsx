'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/navbar'
import StatsCard from '@/components/dashboard/stats-card'
import CheckedOutModal from '@/components/dashboard/checked-out-modal'
import MaintenanceModal from '@/components/dashboard/maintenance-modal'

interface DashboardStats {
  totalAssets: number
  availableAssets: number
  checkedOutAssets: number
  maintenanceAssets: number
  activeTransactions: number
  overdueTransactions: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    availableAssets: 0,
    checkedOutAssets: 0,
    maintenanceAssets: 0,
    activeTransactions: 0,
    overdueTransactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCheckedOutModal, setShowCheckedOutModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // Fetch dashboard stats
    fetchStats()
  }, [status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
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
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-brand-primary-text">
              Welcome back, {session.user?.name}!
            </h1>
            <p className="mt-2 text-gray-800 dark:text-brand-secondary-text">
              Here's an overview of your inventory system
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Assets"
              value={stats.totalAssets}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              variant="default"
            />
            
            <StatsCard
              title="Available"
              value={stats.availableAssets}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              variant="success"
            />
            
            <StatsCard
              title="Checked Out"
              value={stats.checkedOutAssets}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              }
              variant="warning"
              onClick={() => setShowCheckedOutModal(true)}
            />
            
            <StatsCard
              title="In Maintenance"
              value={stats.maintenanceAssets}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              variant="danger"
              onClick={() => setShowMaintenanceModal(true)}
            />
            
            <StatsCard
              title="Active Transactions"
              value={stats.activeTransactions}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
              variant="default"
              href="/transactions"
            />
            
            <StatsCard
              title="Overdue Items"
              value={stats.overdueTransactions}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              }
              variant="danger"
              href="/transactions?filter=overdue"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/assets/new')}
              className="bg-white/80 dark:bg-white/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group"
            >
              <div className="flex items-center">
                <div className="bg-slate-100 dark:bg-white/5 group-hover:bg-white/10 dark:group-hover:bg-white/10 p-3 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-brand-primary-text group-hover:text-black dark:group-hover:text-gray-200">Add Asset</h3>
                  <p className="text-xs text-gray-700 dark:text-brand-secondary-text">Register new equipment</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/assets/cart')}
              className="bg-white/80 dark:bg-white/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group"
            >
              <div className="flex items-center">
                <div className="bg-orange-100 dark:bg-orange-900 group-hover:bg-orange-200 dark:group-hover:bg-orange-800 p-3 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-brand-orange dark:text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-brand-primary-text group-hover:text-black dark:group-hover:text-gray-200">Scan to Cart</h3>
                  <p className="text-xs text-gray-700 dark:text-brand-secondary-text">Quick scan for transactions</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/transactions')}
              className="bg-white/80 dark:bg-white/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group"
            >
              <div className="flex items-center">
                <div className="bg-slate-100 dark:bg-white/5 group-hover:bg-white/10 dark:group-hover:bg-white/10 p-3 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-brand-primary-text group-hover:text-black dark:group-hover:text-gray-200">View Transactions</h3>
                  <p className="text-xs text-gray-700 dark:text-brand-secondary-text">Check-in/out history</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/reports')}
              className="bg-white/80 dark:bg-white/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-300 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group"
            >
              <div className="flex items-center">
                <div className="bg-slate-100 dark:bg-white/5 group-hover:bg-white/10 dark:group-hover:bg-white/10 p-3 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-brand-primary-text group-hover:text-black dark:group-hover:text-gray-200">Generate Reports</h3>
                  <p className="text-xs text-gray-700 dark:text-brand-secondary-text">Analytics & insights</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Checked Out Modal */}
      <CheckedOutModal
        isOpen={showCheckedOutModal}
        onClose={() => setShowCheckedOutModal(false)}
      />

      {/* Maintenance Modal */}
      <MaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />
    </div>
  )
}