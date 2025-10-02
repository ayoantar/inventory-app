import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Asset, AssetStatus, AssetCategory, AssetCondition } from '../../../generated/prisma'
import { formatStatus } from '@/lib/utils'

interface Category {
  id: string
  name: string
  description?: string
  icon: string
  isCustom: boolean
}

interface AssetCardProps {
  asset: Asset & {
    createdBy: { name: string | null; email: string | null }
    lastModifiedBy: { name: string | null; email: string | null }
    _count: { transactions: number }
  }
}

const statusColors = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CHECKED_OUT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300',
  IN_MAINTENANCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300',
  RETIRED: 'bg-gray-100 dark:bg-gray-800 text-gray-300 border-gray-300',
  MISSING: 'bg-red-50 text-red-700 border-red-200',
  RESERVED: 'bg-blue-50 text-blue-700 border-blue-200'
}

const conditionColors = {
  EXCELLENT: 'text-emerald-600',
  GOOD: 'text-blue-600',
  FAIR: 'text-amber-600',
  POOR: 'text-orange-600',
  NEEDS_REPAIR: 'text-red-600'
}

export default function AssetCard({ asset }: AssetCardProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryIcon, setCategoryIcon] = useState('📦')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          const categoryList = data.categories || []
          setCategories(categoryList)
          
          // Find the icon for this asset's category
          const categoryData = categoryList.find((cat: Category) => cat.id === asset.category)
          setCategoryIcon(categoryData?.icon || '📦')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategoryIcon('📦') // fallback icon
      }
    }

    fetchCategories()
  }, [asset.category])
  return (
    <Link href={`/assets/${asset.id}`}>
      <div className="bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 p-6 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mr-3 group-hover transition-colors">
              <span className="text-xl">
                {categoryIcon}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-primary-text truncate group-hover">
                {asset.name}
              </h3>
              <p className="text-sm text-white/50 hover:text-white/80 transition-colors">
                {asset.manufacturer} {asset.model}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusColors[asset.status as AssetStatus]}`}>
            {formatStatus(asset.status)}
          </span>
        </div>

        {asset.description && (
          <div className="text-brand-primary-text text-sm mb-3 space-y-0.5">
            {asset.description.split('\n').slice(0, 3).map((line, index) => (
              <div key={index} className="truncate">
                {line}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {asset.serialNumber && (
              <span className="text-gray-300 font-mono text-xs">
                SN: {asset.serialNumber}
              </span>
            )}
            
            <span className={`font-medium text-xs ${conditionColors[asset.condition as AssetCondition]}`}>
              {asset.condition}
            </span>
          </div>
          
          {asset.location && (
            <span className="text-gray-300 flex items-center text-xs">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {asset.location}
            </span>
          )}
        </div>

        {asset._count.transactions > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-slate-300 bg-gray-900/80 px-2 py-1 rounded-md border border-slate-200">
              {asset._count.transactions} active transaction{asset._count.transactions !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}