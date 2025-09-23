'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Navbar from '@/components/ui/navbar'
import { AssetCategory, AssetCondition } from '../../../../generated/prisma'

interface Location {
  id: string
  name: string
  building?: string
  floor?: string
  room?: string
  description?: string
}

interface Client {
  id: string
  name: string
  code: string
  description?: string
}

interface Category {
  id: string
  name: string
  description?: string
  icon: string
  isCustom: boolean
}

interface AssetFormData {
  name: string
  description: string
  category: AssetCategory | ''
  clientId: string
  serialNumber: string
  barcode: string
  qrCode: string
  locationId: string
  purchaseDate: string
  purchasePrice: string
  currentValue: string
  condition: AssetCondition | ''
  manufacturer: string
  model: string
  notes: string
  imageUrl: string
}

function NewAssetForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    category: '',
    clientId: '',
    serialNumber: '',
    barcode: '',
    qrCode: '',
    locationId: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    condition: '',
    manufacturer: '',
    model: '',
    notes: '',
    imageUrl: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLocationsLoading(true)
        const response = await fetch('/api/locations?active=true&limit=100')
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setLocationsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchLocations()
    }
  }, [status])

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true)
        const response = await fetch('/api/clients?active=true&limit=100')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setClientsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchClients()
    }
  }, [status])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchCategories()
    }
  }, [status])

  // Handle duplication from URL parameters
  useEffect(() => {
    const isDuplicateMode = searchParams?.get('duplicate') === 'true'
    setIsDuplicate(isDuplicateMode)
    
    if (isDuplicateMode && searchParams) {
      setFormData({
        name: searchParams.get('name') || '',
        description: searchParams.get('description') || '',
        category: (searchParams.get('category') as AssetCategory) || '',
        clientId: searchParams.get('clientId') || '',
        manufacturer: searchParams.get('manufacturer') || '',
        model: searchParams.get('model') || '',
        serialNumber: '', // Keep empty for duplicates
        barcode: '', // Keep empty for duplicates
        qrCode: '', // Keep empty for duplicates
        condition: (searchParams.get('condition') as AssetCondition) || 'GOOD',
        locationId: searchParams.get('locationId') || '',
        purchasePrice: searchParams.get('purchasePrice') || '',
        currentValue: searchParams.get('currentValue') || '',
        purchaseDate: '', // Keep empty for duplicates
        notes: searchParams.get('notes') || '',
        imageUrl: ''
      })
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.clientId) {
        setError('Name, category, and client are required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          condition: formData.condition || 'GOOD',
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
          purchaseDate: formData.purchaseDate || null
        }),
      })

      if (response.ok) {
        const asset = await response.json()
        router.push(`/assets/${asset.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create asset')
      }
    } catch (error) {
      setError('An error occurred while creating the asset')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Breadcrumb */}
          <div className="mb-8">
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-2">
                <li className="inline-flex items-center">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="text-gray-600 dark:text-brand-secondary-text hover"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Dashboard
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-white/50 hover:text-white/80 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <button 
                      onClick={() => router.push('/assets')}
                      className="ml-2 text-gray-600 dark:text-brand-secondary-text hover"
                    >
                      Assets
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-white/50 hover:text-white/80 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-brand-primary-text font-medium">
                      {isDuplicate ? 'Duplicate Asset' : 'Add New Asset'}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-brand-primary-text">
                  {isDuplicate ? 'Duplicate Asset' : 'Add New Asset'}
                </h1>
                <p className="mt-2 text-brand-primary-text">
                  {isDuplicate 
                    ? 'Create a new asset based on an existing one with pre-filled information'
                    : 'Register a new asset in your inventory system with detailed information'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-900/5 text-sm font-medium text-gray-300 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {isDuplicate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Duplicating Asset</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Form pre-filled with data from the original asset. Serial number and barcode fields are cleared for the new asset.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Basic Information */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-gray-900/5 shadow-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-50 p-2 rounded-lg mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-brand-primary-text">Basic Information</h2>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Essential details about the asset</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                    <div className="space-y-1">
                      <label htmlFor="name" className="block text-sm font-semibold text-brand-primary-text">
                        Asset Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., Canon EOS R5"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Enter a descriptive name for the asset</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="category" className="block text-sm font-semibold text-brand-primary-text">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="">Select a category</option>
                        {categoriesLoading ? (
                          <option disabled>Loading categories...</option>
                        ) : (
                          categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Choose the appropriate category</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="clientId" className="block text-sm font-semibold text-brand-primary-text">
                        Client/Company *
                      </label>
                      <select
                        id="clientId"
                        name="clientId"
                        required
                        value={formData.clientId}
                        onChange={handleChange}
                        disabled={clientsLoading}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {clientsLoading ? 'Loading clients...' : 'Select a client'}
                        </option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name} ({client.code})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Select the client/company that owns this asset</p>
                        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                          <button
                            type="button"
                            onClick={() => window.open('/clients', '_blank')}
                            className="text-xs text-blue-600 hover font-medium"
                          >
                            Manage Clients
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label htmlFor="description" className="block text-sm font-semibold text-brand-primary-text">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                        placeholder="Brief description of the asset, its features, and any important details"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Provide additional details about the asset</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="condition" className="block text-sm font-semibold text-brand-primary-text">
                        Condition
                      </label>
                      <select
                        id="condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="EXCELLENT">🟢 Excellent</option>
                        <option value="GOOD">🔵 Good</option>
                        <option value="FAIR">🟡 Fair</option>
                        <option value="POOR">🟠 Poor</option>
                        <option value="NEEDS_REPAIR">🔴 Needs Repair</option>
                      </select>
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Current physical condition</p>
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-gray-900/5 shadow-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-50 p-2 rounded-lg mr-4">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-brand-primary-text">Technical Details</h2>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Specifications and identifiers</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label htmlFor="manufacturer" className="block text-sm font-semibold text-brand-primary-text">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        id="manufacturer"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., Canon, Sony, Apple"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Brand or company name</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="model" className="block text-sm font-semibold text-brand-primary-text">
                        Model
                      </label>
                      <input
                        type="text"
                        id="model"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="e.g., EOS R5, MacBook Pro"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Specific model name or number</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="serialNumber" className="block text-sm font-semibold text-brand-primary-text">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        id="serialNumber"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Unique identifier from manufacturer"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">For warranty and tracking purposes</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="barcode" className="block text-sm font-semibold text-brand-primary-text">
                        Barcode
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="barcode"
                          name="barcode"
                          value={formData.barcode}
                          onChange={handleChange}
                          className="w-full border border-gray-600 rounded-lg px-4 py-3 pr-12 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="Scan or enter barcode"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-white/50 hover:text-white/80 transition-colors hover"
                          title="Scan barcode"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Internal tracking code or external barcode</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-gray-900/5 shadow-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-emerald-50 p-2 rounded-lg mr-4">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-brand-primary-text">Financial Information</h2>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Pricing and value tracking</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label htmlFor="purchaseDate" className="block text-sm font-semibold text-brand-primary-text">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        id="purchaseDate"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">When the asset was acquired</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="locationId" className="block text-sm font-semibold text-brand-primary-text">
                        Current Location
                      </label>
                      <select
                        id="locationId"
                        name="locationId"
                        value={formData.locationId}
                        onChange={handleChange}
                        disabled={locationsLoading}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {locationsLoading ? 'Loading locations...' : 'Select a location'}
                        </option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.building && location.floor ? 
                              `${location.name} (${location.building} - Floor ${location.floor})` :
                              location.building ? 
                                `${location.name} (${location.building})` :
                                location.name
                            }
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Select the physical location of the asset</p>
                        {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                          <button
                            type="button"
                            onClick={() => window.open('/locations', '_blank')}
                            className="text-xs text-blue-600 hover font-medium"
                          >
                            Manage Locations
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="purchasePrice" className="block text-sm font-semibold text-brand-primary-text">
                        Purchase Price
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600 dark:text-brand-secondary-text sm">$</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          id="purchasePrice"
                          name="purchasePrice"
                          value={formData.purchasePrice}
                          onChange={handleChange}
                          className="w-full border border-gray-600 rounded-lg pl-8 pr-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Original cost when purchased</p>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="currentValue" className="block text-sm font-semibold text-brand-primary-text">
                        Current Value
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600 dark:text-brand-secondary-text sm">$</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          id="currentValue"
                          name="currentValue"
                          value={formData.currentValue}
                          onChange={handleChange}
                          className="w-full border border-gray-600 rounded-lg pl-8 pr-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Estimated current market value</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-8">
                {/* Image Upload */}
                <div className="bg-gray-900/5 shadow-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-50 p-2 rounded-lg mr-4">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-brand-primary-text">Asset Image</h2>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Visual identification</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-400:border-gray-500 transition-colors">
                      <svg className="mx-auto h-12 w-12 text-white/50 hover:text-white/80 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-4">
                        <p className="text-sm text-brand-primary-text">
                          <span className="font-medium text-blue-600 hover cursor-pointer">Upload a file</span>
                          {' '}or drag and drop
                        </p>
                        <p className="text-xs text-gray-600 dark:text-brand-secondary-text mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="imageUrl" className="block text-sm font-semibold text-brand-primary-text">
                        Or enter image URL
                      </label>
                      <input
                        type="url"
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Link to external image</p>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-gray-900/5 shadow-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-amber-50 p-2 rounded-lg mr-4">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-brand-primary-text">Additional Notes</h2>
                      <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Extra information</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      id="notes"
                      name="notes"
                      rows={6}
                      value={formData.notes}
                      onChange={handleChange}
                      className="w-full border border-gray-600 rounded-lg px-4 py-3 bg-gray-900 text-brand-primary-text placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Add any additional information, special handling instructions, warranty details, or other relevant notes about this asset..."
                    />
                    <p className="text-xs text-gray-600 dark:text-brand-secondary-text">Optional additional information</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900/5 shadow-sm rounded-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-brand-primary-text mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-gray-900 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                      </svg>
                      Generate QR Code
                    </button>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-gray-900 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-2 12a2 2 0 002 2h8a2 2 0 002-2l-2-12" />
                      </svg>
                      Save as Template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-700">
              <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
                Fields marked with * are required
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-6 py-3 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 bg-gray-900/5 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isDuplicate ? 'Duplicating Asset...' : 'Creating Asset...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {isDuplicate ? 'Duplicate Asset' : 'Create Asset'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    </div>
  )
}

export default function NewAssetPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewAssetForm />
    </Suspense>
  )
}