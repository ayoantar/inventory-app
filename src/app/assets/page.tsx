'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/navbar'
import AssetTable from '@/components/assets/asset-table'
import AdvancedFilters from '@/components/assets/advanced-filters'
import BarcodeSearch from '@/components/barcode/barcode-search'
import ImportDialog from '@/components/assets/import-dialog'
import BulkActionsToolbar from '@/components/assets/bulk-actions-toolbar'
import { Asset, AssetCategory, AssetStatus } from '../../../generated/prisma'

interface AssetWithRelations extends Asset {
  client?: { name: string; code: string; isActive: boolean } | null
  createdBy: { name: string | null; email: string | null }
  lastModifiedBy: { name: string | null; email: string | null }
  _count: { transactions: number }
}

interface AssetsResponse {
  assets: AssetWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AssetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assets, setAssets] = useState<AssetWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    location: '',
    manufacturer: '',
    client: ''
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  const [exporting, setExporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    fetchAssets()
  }, [status, router, filters, pagination.page])

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.location && { location: filters.location }),
        ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
        ...(filters.client && { client: filters.client }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/assets?${params}`)
      if (response.ok) {
        const data: AssetsResponse = await response.json()
        setAssets(data.assets)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersApply = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFiltersReset = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
      location: '',
      manufacturer: '',
      client: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.condition && { condition: filters.condition }),
        ...(filters.location && { location: filters.location }),
        ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
        ...(filters.client && { client: filters.client }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })

      const response = await fetch(`/api/assets/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'assets.xlsx'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleBulkAction = async (action: string, data?: any) => {
    setBulkLoading(true)
    try {
      if (action === 'export') {
        // Export selected assets
        const response = await fetch('/api/assets/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'export',
            assetIds: selectedAssets
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'selected-assets.csv'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        } else {
          const errorData = await response.json()
          alert('Export failed: ' + errorData.error)
        }
      } else {
        // Other bulk actions (status change, delete)
        const response = await fetch('/api/assets/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            assetIds: selectedAssets,
            data
          })
        })

        if (response.ok) {
          const result = await response.json()
          alert(result.message || 'Action completed successfully')
          
          // Refresh assets list
          fetchAssets()
          
          // Clear selection and exit bulk mode
          setSelectedAssets([])
          setBulkMode(false)
        } else {
          const errorData = await response.json()
          alert('Action failed: ' + errorData.error)
        }
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
      alert('Bulk action failed. Please try again.')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkCancel = () => {
    setSelectedAssets([])
    setBulkMode(false)
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedAssets([])
  }

  const handleDuplicate = (asset: Asset) => {
    // Create URL with pre-filled data for duplication
    const duplicateParams = new URLSearchParams({
      duplicate: 'true',
      name: asset.name || '',
      description: asset.description || '',
      category: asset.category,
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      condition: asset.condition,
      location: asset.location || '',
      purchasePrice: asset.purchasePrice?.toString() || '',
      currentValue: asset.currentValue?.toString() || '',
      notes: asset.notes || ''
    })
    
    router.push(`/assets/new?${duplicateParams.toString()}`)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-dark-blue via-gray-925 to-brand-black">
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
    <div className="min-h-screen bg-gradient-to-br from-brand-dark-blue via-gray-925 to-brand-black">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary-text to-gray-200 bg-clip-text text-transparent">
                    Assets
                  </h1>
                </div>
                <p className="text-brand-secondary-text ml-11 max-w-2xl">
                  Manage your inventory assets ({pagination.total} total)
                </p>
              </div>
              <div className="flex space-x-3">
              <Link
                href="/assets/cart"
                className="bg-brand-orange hover:bg-primary-600 text-brand-primary-text px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v0a2 2 0 002 2h8.5m-10.5-2v-2a2 2 0 012-2h8.5" />
                </svg>
                Scan to Cart
              </Link>
              <button
                onClick={toggleBulkMode}
                className={`px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors ${
                  bulkMode
                    ? 'bg-brand-orange hover:bg-primary-600 text-brand-primary-text'
                    : 'bg-white/5 hover:bg-white/10 text-gray-200'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="bg-primary-600 hover:bg-primary-700 text-brand-primary-text px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import Excel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-brand-primary-text px-4 py-2 rounded-md text-sm font-medium inline-flex items-center transition-colors"
              >
                {exporting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </>
                )}
              </button>
              <Link
                href="/assets/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Asset
              </Link>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-primary-text to-gray-200 bg-clip-text text-transparent">
                    Assets
                  </h1>
                  <p className="text-sm text-brand-secondary-text">
                    {pagination.total} total assets
                  </p>
                </div>
              </div>

              {/* Mobile Action Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Link
                  href="/assets/cart"
                  className="bg-brand-orange hover:bg-primary-600 text-brand-primary-text px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v0a2 2 0 002 2h8.5m-10.5-2v-2a2 2 0 012-2h8.5" />
                  </svg>
                  Scan to Cart
                </Link>
                <button
                  onClick={toggleBulkMode}
                  className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors active:scale-95 touch-manipulation ${
                    bulkMode
                      ? 'bg-brand-orange hover:bg-primary-600 text-brand-primary-text'
                      : 'bg-white/5 hover:bg-white/10 text-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {bulkMode ? 'Exit Bulk' : 'Bulk Actions'}
                </button>
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-brand-primary-text px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Import Excel
                </button>
                <Link
                  href="/assets/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center active:scale-95 touch-manipulation"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Asset
                </Link>
              </div>

              {/* Mobile Export Button - Full Width */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-brand-primary-text px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors active:scale-95 touch-manipulation"
              >
                {exporting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Barcode Search */}
          <div className="mb-6">
            <BarcodeSearch className="" />
          </div>

          {/* Advanced Filters - Hidden by default on mobile */}
          <div className="hidden md:block">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onApply={handleFiltersApply}
              onReset={handleFiltersReset}
              isExpanded={filtersExpanded}
              onToggle={() => setFiltersExpanded(!filtersExpanded)}
            />
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full bg-white/5 hover:bg-white/10 border border-gray-600 rounded-lg px-4 py-3 text-sm font-medium text-gray-200 flex items-center justify-between transition-colors active:scale-95 touch-manipulation"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span>
                  {Object.values(filters).some(value => value && value !== '')
                    ? 'Filters Applied'
                    : 'Show Filters'
                  }
                </span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {filtersExpanded && (
              <div className="mt-3">
                <AdvancedFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  onApply={handleFiltersApply}
                  onReset={handleFiltersReset}
                  isExpanded={filtersExpanded}
                  onToggle={() => setFiltersExpanded(!filtersExpanded)}
                />
              </div>
            )}
          </div>

          {/* Bulk Actions Toolbar */}
          {bulkMode && selectedAssets.length > 0 && (
            <BulkActionsToolbar
              selectedCount={selectedAssets.length}
              onBulkAction={handleBulkAction}
              onCancel={handleBulkCancel}
            />
          )}

          {/* Assets Table */}
          <AssetTable 
            assets={assets}
            selectedAssets={selectedAssets}
            onSelectionChange={setSelectedAssets}
            bulkMode={bulkMode}
            onDuplicate={handleDuplicate}
          />

          {/* Pagination */}
          {assets.length > 0 && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-white/10 bg-gray-900/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm border border-gray-600 rounded-md bg-gray-900/5 text-slate-300">
                  {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm border border-gray-600 rounded-md hover:bg-white/10 bg-gray-900/5 text-brand-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {assets.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-brand-primary-text">No assets found</h3>
              <p className="mt-1 text-sm text-brand-secondary-text">
                {Object.values(filters).some(value => value !== '')
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first asset'
                }
              </p>
              {!Object.values(filters).some(value => value !== '') && (
                <div className="mt-6">
                  <Link
                    href="/assets/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Asset
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={() => {
          setShowImportDialog(false)
          fetchAssets() // Refresh the assets list
        }}
      />

    </div>
  )
}