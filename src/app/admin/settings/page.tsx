'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SystemSettings {
  systemName: string
  timezone: string
  maintenanceMode: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  forcePasswordChange: boolean
  twoFactorAuth: boolean
}

interface SystemInfo {
  version: string
  databaseStatus: string
  lastBackup: string
  uptime: number
  serverLoad: string
  serverLoadDetails?: {
    status: 'healthy' | 'warning' | 'critical'
    cpuCores: number
    loadAverage: {
      '1min': number
      '5min': number
      '15min': number
    }
    normalizedLoad: number
    memory: {
      totalGB: number
      freeGB: number
      usagePercent: number
    }
    maxLoad: number
  }
  nodeVersion: string
  platform: string
  arch: string
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
}

export default function SystemSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Only admins can access system settings
    if ((session.user as any).role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchSettings()
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setSystemInfo(data.systemInfo)
      } else {
        setError('Failed to load settings')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Settings saved successfully!')
        setSettings(data.settings)
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        if (data.results) {
          console.log('System diagnostics results:', data.results)
        }
        // Refresh system info after actions
        if (action === 'create-backup') {
          fetchSettings()
        }
        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000)
      } else {
        setError(data.error || `Failed to ${action.replace('-', ' ')}`)
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      setError(`Failed to ${action.replace('-', ' ')}`)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-900 dark:to-brand-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-900 dark:to-brand-black">
      {/* Header */}
      <div className="bg-white/80 dark:bg-white/5 shadow-sm border-b border-gray-300 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-700 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-brand-primary-text">System Settings</h1>
                <p className="text-sm text-gray-700 dark:text-brand-secondary-text">Configure system-wide settings and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm">{message}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* General Settings */}
          <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">General Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  value={settings?.systemName || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, systemName: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Timezone
                </label>
                <select 
                  value={settings?.timezone || 'UTC'}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenance-mode"
                  checked={settings?.maintenanceMode || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, maintenanceMode: e.target.checked } : null)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenance-mode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable maintenance mode
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mr-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">Security Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings?.sessionTimeout || 60}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, sessionTimeout: parseInt(e.target.value) } : null)}
                  min="15"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Login Attempts
                </label>
                <input
                  type="number"
                  value={settings?.maxLoginAttempts || 5}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, maxLoginAttempts: parseInt(e.target.value) } : null)}
                  min="3"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="force-password-change"
                  checked={settings?.forcePasswordChange || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, forcePasswordChange: e.target.checked } : null)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="force-password-change" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Force password change on first login
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="two-factor-auth"
                  checked={settings?.twoFactorAuth || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, twoFactorAuth: e.target.checked } : null)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="two-factor-auth" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable two-factor authentication
                </label>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white/80 dark:bg-white/5 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-primary-text">System Information</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Version</span>
                <span className="text-gray-900 dark:text-brand-primary-text font-mono">{systemInfo?.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Database Status</span>
                <span className="text-green-600 dark:text-green-400">{systemInfo?.databaseStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Last Backup</span>
                <span className="text-gray-900 dark:text-brand-primary-text">
                  {systemInfo?.lastBackup ? new Date(systemInfo.lastBackup).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Uptime</span>
                <span className="text-gray-900 dark:text-brand-primary-text">
                  {systemInfo?.uptime ? formatUptime(systemInfo.uptime) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Server Load</span>
                <div className="text-right">
                  <span className={`${
                    systemInfo?.serverLoad === 'Low' ? 'text-green-600 dark:text-green-400' :
                    systemInfo?.serverLoad === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                    systemInfo?.serverLoad === 'High' ? 'text-orange-600 dark:text-orange-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {systemInfo?.serverLoad}
                  </span>
                  {systemInfo?.serverLoadDetails && (
                    <div className="text-xs text-gray-700 dark:text-brand-secondary-text mt-1">
                      Load: {systemInfo.serverLoadDetails.loadAverage['1min']} | 
                      Mem: {systemInfo.serverLoadDetails.memory.usagePercent}%
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Memory Usage</span>
                <span className="text-gray-900 dark:text-brand-primary-text">
                  {systemInfo?.memoryUsage ? formatBytes(systemInfo.memoryUsage.heapUsed) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-400">Platform</span>
                <span className="text-gray-900 dark:text-brand-primary-text font-mono">
                  {systemInfo?.platform} ({systemInfo?.arch})
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
              <a
                href="/api/health"
                target="_blank"
                className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                View detailed health report
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('create-backup')}
            className="p-4 bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-brand-primary-text">Create Backup</h4>
                <p className="text-sm text-gray-700 dark:text-brand-secondary-text">Generate system backup</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleQuickAction('test-system')}
            className="p-4 bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-brand-primary-text">Test System</h4>
                <p className="text-sm text-gray-700 dark:text-brand-secondary-text">Run system diagnostics</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleQuickAction('clear-cache')}
            className="p-4 bg-white/80 dark:bg-white/5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-brand-primary-text">Clear Cache</h4>
                <p className="text-sm text-gray-700 dark:text-brand-secondary-text">Clear system cache</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}