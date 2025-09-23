'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'

interface Location {
  id: string
  name: string
  building: string | null
  floor: string | null
  room: string | null
  description: string | null
  capacity: number | null
  isActive: boolean
}

interface LocationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  location?: Location | null
  mode: 'create' | 'edit'
}

export default function LocationDialog({
  isOpen,
  onClose,
  onSave,
  location,
  mode
}: LocationDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    room: '',
    description: '',
    capacity: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (location && mode === 'edit') {
      setFormData({
        name: location.name || '',
        building: location.building || '',
        floor: location.floor || '',
        room: location.room || '',
        description: location.description || '',
        capacity: location.capacity?.toString() || '',
        isActive: location.isActive
      })
    } else {
      setFormData({
        name: '',
        building: '',
        floor: '',
        room: '',
        description: '',
        capacity: '',
        isActive: true
      })
    }
    setError('')
  }, [location, mode, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = mode === 'create' 
        ? '/api/locations'
        : `/api/locations/${location?.id}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          building: formData.building.trim() || null,
          floor: formData.floor.trim() || null,
          room: formData.room.trim() || null,
          description: formData.description.trim() || null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          isActive: formData.isActive
        })
      })

      if (response.ok) {
        onSave()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${mode} location`)
      }
    } catch (error) {
      setError(`An error occurred while ${mode === 'create' ? 'creating' : 'updating'} the location`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <Dialog.Title className="text-xl font-semibold text-brand-primary-text">
                  {mode === 'create' ? 'Add New Location' : 'Edit Location'}
                </Dialog.Title>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white/80 transition-colors hover transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900 text-brand-primary-text"
                  placeholder="Enter location name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="building" className="block text-sm font-medium text-gray-300 mb-1">
                    Building
                  </label>
                  <input
                    type="text"
                    id="building"
                    name="building"
                    value={formData.building}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900 text-brand-primary-text"
                    placeholder="Building name"
                  />
                </div>

                <div>
                  <label htmlFor="floor" className="block text-sm font-medium text-gray-300 mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900 text-brand-primary-text"
                    placeholder="Floor number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-300 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900 text-brand-primary-text"
                  placeholder="Room number or name"
                />
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900 text-brand-primary-text"
                  placeholder="Maximum capacity"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-900 text-brand-primary-text"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-600 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                  Active location
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-900/5 hover rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {loading 
                    ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                    : (mode === 'create' ? 'Create Location' : 'Update Location')
                  }
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}