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
  smtp?: {
    enabled: boolean
    host: string
    port: number
    secure: boolean
    user: string
    password: string
    from: string
    replyTo: string
  }
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
      // First update general settings
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        // Then update SMTP settings if they've been changed
        if (settings.smtp) {
          const smtpResponse = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'update-smtp',
              smtp: settings.smtp
            })
          })

          const smtpData = await smtpResponse.json()
          if (!smtpResponse.ok) {
            setError(smtpData.error || 'Failed to save SMTP settings')
            return
          }
        }

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

  const handleTestEmail = async () => {
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'test-email' })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Test email sent successfully!')
        setTimeout(() => setMessage(''), 5000)
      } else {
        setError(data.error || 'Failed to send test email')
        setTimeout(() => setError(''), 5000)
      }
    } catch (error) {
      console.error('Failed to send test email:', error)
      setError('Failed to send test email')
      setTimeout(() => setError(''), 5000)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      {/* Header */}
      <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-white/60 dark:text-white/60 hover:text-slate-500 dark:hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-brand-primary-text">System Settings</h1>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Configure system-wide settings and preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* General Settings */}
          <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-primary-text">General Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Name
                </label>
                <input
                  type="text"
                  value={settings?.systemName || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, systemName: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Timezone
                </label>
                <select 
                  value={settings?.timezone || 'UTC'}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <label htmlFor="maintenance-mode" className="ml-2 block text-sm text-gray-300">
                  Enable maintenance mode
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-50 rounded-lg mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-primary-text">Security Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings?.sessionTimeout || 60}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, sessionTimeout: parseInt(e.target.value) } : null)}
                  min="15"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Login Attempts
                </label>
                <input
                  type="number"
                  value={settings?.maxLoginAttempts || 5}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, maxLoginAttempts: parseInt(e.target.value) } : null)}
                  min="3"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="force-password-change"
                  checked={settings?.forcePasswordChange || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, forcePasswordChange: e.target.checked } : null)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <label htmlFor="force-password-change" className="ml-2 block text-sm text-gray-300">
                  Force password change on first login
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="two-factor-auth"
                  checked={settings?.twoFactorAuth || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, twoFactorAuth: e.target.checked } : null)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <label htmlFor="two-factor-auth" className="ml-2 block text-sm text-gray-300">
                  Enable two-factor authentication
                </label>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-50 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brand-primary-text">System Information</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Version</span>
                <span className="text-brand-primary-text font-mono">{systemInfo?.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Database Status</span>
                <span className="text-green-600">{systemInfo?.databaseStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Last Backup</span>
                <span className="text-brand-primary-text">
                  {systemInfo?.lastBackup ? new Date(systemInfo.lastBackup).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Uptime</span>
                <span className="text-brand-primary-text">
                  {systemInfo?.uptime ? formatUptime(systemInfo.uptime) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Server Load</span>
                <div className="text-right">
                  <span className={`${
                    systemInfo?.serverLoad === 'Low' ? 'text-green-600' :
                    systemInfo?.serverLoad === 'Medium' ? 'text-yellow-600' :
                    systemInfo?.serverLoad === 'High' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {systemInfo?.serverLoad}
                  </span>
                  {systemInfo?.serverLoadDetails && (
                    <div className="text-xs text-gray-600 dark:text-brand-secondary-text mt-1">
                      Load: {systemInfo.serverLoadDetails.loadAverage['1min']} | 
                      Mem: {systemInfo.serverLoadDetails.memory.usagePercent}%
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Memory Usage</span>
                <span className="text-brand-primary-text">
                  {systemInfo?.memoryUsage ? formatBytes(systemInfo.memoryUsage.heapUsed) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-primary-text">Platform</span>
                <span className="text-brand-primary-text font-mono">
                  {systemInfo?.platform} ({systemInfo?.arch})
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <a
                href="/api/health"
                target="_blank"
                className="inline-flex items-center text-sm text-blue-600 hover"
              >
                View detailed health report
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Email (SMTP) Settings - Full Width */}
        <div className="mt-8 bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-primary-text">Email (SMTP) Settings</h3>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Configure email notifications for transaction confirmations</p>
              </div>
            </div>
            {settings?.smtp?.enabled && (
              <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full">
                Configured
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings?.smtp?.host || ''}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    smtp: { ...prev.smtp!, host: e.target.value }
                  } : null)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={settings?.smtp?.port || 587}
                    onChange={(e) => setSettings(prev => prev ? {
                      ...prev,
                      smtp: { ...prev.smtp!, port: parseInt(e.target.value) }
                    } : null)}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smtp-secure"
                      checked={settings?.smtp?.secure || false}
                      onChange={(e) => setSettings(prev => prev ? {
                        ...prev,
                        smtp: { ...prev.smtp!, secure: e.target.checked }
                      } : null)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded"
                    />
                    <label htmlFor="smtp-secure" className="ml-2 block text-sm text-gray-300">
                      Use SSL/TLS
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={settings?.smtp?.user || ''}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    smtp: { ...prev.smtp!, user: e.target.value }
                  } : null)}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={settings?.smtp?.password || ''}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    smtp: { ...prev.smtp!, password: e.target.value }
                  } : null)}
                  placeholder="App password (not your regular password)"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">
                  For Gmail/Outlook, use an app password, not your regular password
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  From Address
                </label>
                <input
                  type="text"
                  value={settings?.smtp?.from || ''}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    smtp: { ...prev.smtp!, from: e.target.value }
                  } : null)}
                  placeholder="LSVR Warehouse <warehouse@lightsailvr.com>"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reply-To Address
                </label>
                <input
                  type="text"
                  value={settings?.smtp?.replyTo || ''}
                  onChange={(e) => setSettings(prev => prev ? {
                    ...prev,
                    smtp: { ...prev.smtp!, replyTo: e.target.value }
                  } : null)}
                  placeholder="support@lightsailvr.com"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-brand-primary-text placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Test Email Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={!settings?.smtp?.user || !settings?.smtp?.password}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Send Test Email</span>
                </button>
                {settings?.smtp?.user && settings?.smtp?.password && (
                  <p className="mt-2 text-xs text-gray-400 text-center">
                    Test email will be sent to your admin account email
                  </p>
                )}
              </div>

              {/* Common Providers Help */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Common SMTP Settings:</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div><strong>Gmail:</strong> smtp.gmail.com, Port 587, TLS</div>
                  <div><strong>Outlook:</strong> smtp-mail.outlook.com, Port 587, TLS</div>
                  <div><strong>Yahoo:</strong> smtp.mail.yahoo.com, Port 587, TLS</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-300 hover border border-gray-600 rounded-lg hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
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
            className="p-4 bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm border border-gray-700 rounded-lg hover transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div>
                <h4 className="font-medium text-brand-primary-text">Create Backup</h4>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Generate system backup</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleQuickAction('test-system')}
            className="p-4 bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm border border-gray-700 rounded-lg hover transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-brand-primary-text">Test System</h4>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Run system diagnostics</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleQuickAction('clear-cache')}
            className="p-4 bg-white/90 dark:bg-brand-dark-blue/90 backdrop-blur-sm border border-gray-700 rounded-lg hover transition-colors text-left"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-medium text-brand-primary-text">Clear Cache</h4>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Clear system cache</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}