'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import MaintenanceTable from '@/components/maintenance/maintenance-table'
import MobileMaintenanceCard from '@/components/maintenance/mobile-maintenance-card'
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType } from '../../../generated/prisma'

interface MaintenanceRecordWithRelations extends MaintenanceRecord {
  asset: { id: string; name: string; serialNumber: string | null }
  performedBy: { name: string | null; email: string | null } | null
  createdBy: { name: string | null; email: string | null }
}

interface MaintenanceResponse {
  maintenanceRecords: MaintenanceRecordWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function MaintenancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecordWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchMaintenanceRecords()
  }, [status, router, filters, pagination.page])

  const fetchMaintenanceRecords = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search })
      })

      const response = await fetch(`/api/maintenance?${params}`)
      if (response.ok) {
        const data: MaintenanceResponse = await response.json()
        setMaintenanceRecords(data.maintenanceRecords)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error('Failed to fetch maintenance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: MaintenanceStatus) => {
    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchMaintenanceRecords()
      }
    } catch (error) {
      console.error('Failed to update maintenance status:', error)
    }
  }

  const handlePriorityUpdate = async (id: string, priority: string) => {
    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      })

      if (response.ok) {
        fetchMaintenanceRecords()
      }
    } catch (error) {
      console.error('Failed to update maintenance priority:', error)
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        fetchMaintenanceRecords()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update maintenance record')
      }
    } catch (error) {
      console.error('Failed to update maintenance record:', error)
      throw error
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({ status: '', type: '', search: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
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
      
      <div className="max-w-7xl mx-auto py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 mb-2">
                  <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-brand-primary-text">
                    Maintenance
                  </h1>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-brand-secondary-text">
                  Manage maintenance schedules and track repairs ({pagination.total} records)
                </p>
              </div>
              <Link
                href="/assets"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium inline-flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                View Assets
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search descriptions..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-brand-secondary-text mb-1">
                  Type
                </label>
                <select
                  id="type"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white/80 dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="INSPECTION">Inspection</option>
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="CALIBRATION">Calibration</option>
                </select>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                {Object.values(filters).some(value => value !== '') && (
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 touch-manipulation"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-3">
            {maintenanceRecords.map((maintenance) => (
              <MobileMaintenanceCard
                key={maintenance.id}
                maintenance={maintenance}
                onStatusUpdate={handleStatusUpdate}
                onPriorityUpdate={handlePriorityUpdate}
              />
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <MaintenanceTable
              maintenanceRecords={maintenanceRecords}
              onStatusUpdate={handleStatusUpdate}
              onPriorityUpdate={handlePriorityUpdate}
              onUpdate={handleUpdate}
              showAssetColumn={true}
            />
          </div>

          {/* Pagination */}
          {maintenanceRecords.length > 0 && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-brand-secondary-text text-center sm:text-left">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 bg-white/80 dark:bg-white/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-blue-600 text-white">
                  {pagination.page} of {pagination.pages}
                </span>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 bg-white/80 dark:bg-white/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-manipulation"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {maintenanceRecords.length === 0 && !loading && (
            <div className="text-center py-8 sm:py-12">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <h3 className="mt-2 text-sm sm:text-base font-medium text-brand-primary-text">No maintenance records found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-brand-secondary-text">
                {Object.values(filters).some(value => value !== '')
                  ? 'Try adjusting your filters'
                  : 'No maintenance has been scheduled yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}