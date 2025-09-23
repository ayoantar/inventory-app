'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/navbar'

interface AssetCountData {
  totalWithoutNumbers: number
  breakdown: Array<{
    category: string
    count: number
  }>
}

export default function BulkAssignNumbersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [countData, setCountData] = useState<AssetCountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    const userRole = (session?.user as any)?.role
    if (userRole !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchCount()
  }, [status, router, session])

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/admin/bulk-assign-asset-numbers')
      if (response.ok) {
        const data = await response.json()
        setCountData(data)
      }
    } catch (error) {
      console.error('Failed to fetch count:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    if (!confirm(`This will assign asset numbers to ${countData?.totalWithoutNumbers} assets. Continue?`)) {
      return
    }

    setAssigning(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/bulk-assign-asset-numbers', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(`Success: ${data.message}`)
        fetchCount() // Refresh the count
      } else {
        setResult(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to bulk assign:', error)
      setResult('Error: Failed to bulk assign asset numbers')
    } finally {
      setAssigning(false)
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

  if (!session || (session.user as any).role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-primary-text">
                Bulk Assign Asset Numbers
              </h1>
              <p className="text-brand-primary-text mt-2">
                Assign asset numbers to all assets that don't have them
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-white/60 dark:text-white/60 hover:text-slate-500 dark:hover:text-slate-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Count Summary */}
        <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-brand-primary-text mb-4">
            Assets Without Asset Numbers
          </h2>
          
          {countData && (
            <>
              <div className="text-3xl font-bold text-indigo-600 mb-4">
                {countData.totalWithoutNumbers}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-300">
                  Breakdown by Category:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {countData.breakdown.map(item => (
                    <div key={item.category} className="bg-gray-900/5 rounded p-2">
                      <div className="text-sm font-medium text-brand-primary-text">
                        {item.category}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-brand-secondary-text">
                        {item.count} assets
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-brand-primary-text mb-4">
            Bulk Assignment
          </h2>
          
          <p className="text-sm text-brand-primary-text mb-6">
            This will automatically generate and assign unique asset numbers to all assets that currently don't have them. 
            Asset numbers will follow the format: <code className="bg-gray-900/5 px-2 py-1 rounded">LSVR-{'{CATEGORY}'}-{'{NUMBER}'}</code>
          </p>
          
          <button
            onClick={handleBulkAssign}
            disabled={assigning || !countData || countData.totalWithoutNumbers === 0}
            className="bg-indigo-600 hover disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            {assigning && (
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-3-2.647z" />
              </svg>
            )}
            {assigning ? 'Assigning...' : `Assign Asset Numbers (${countData?.totalWithoutNumbers || 0})`}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-lg border p-4 ${
            result.startsWith('Success') 
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="font-medium">{result}</p>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Warning</p>
              <p>This operation cannot be undone. Asset numbers will be permanently assigned to assets. Make sure you want to proceed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}