'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  role: string
  department: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Set profile from session data
    setProfile({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role,
      department: (session.user as any).department,
      isActive: true, // Assume active if logged in
      lastLoginAt: new Date().toISOString(), // Current session
      createdAt: '', // Not available in session
      updatedAt: ''   // Not available in session
    })
    setLoading(false)
  }, [session, status, router])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  const userRole = profile.role
  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const isPrivilegedUser = isAdmin || isManager

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black">
      {/* Header */}
      <div className="bg-gray-900/5 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-white/60 dark:text-white/60 hover:text-slate-500 dark:hover:text-slate-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-brand-primary-text">My Profile</h1>
                <p className="text-sm text-gray-600 dark:text-brand-secondary-text">Account settings and management options</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Information */}
        <div className="bg-gray-900/5 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : profile.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-brand-primary-text">
                {profile.name || 'No name set'}
              </h2>
              <p className="text-brand-primary-text">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin 
                    ? 'bg-red-100 text-red-800'
                    : isManager
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {profile.role}
                </span>
                {profile.department && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-brand-primary-text">
                    {profile.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <p className="text-sm text-brand-primary-text bg-gray-900/5 rounded-lg px-3 py-2">
                {profile.name || 'Not set'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <p className="text-sm text-brand-primary-text bg-gray-900/5 rounded-lg px-3 py-2">
                {profile.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Role
              </label>
              <p className="text-sm text-brand-primary-text bg-gray-900/5 rounded-lg px-3 py-2">
                {profile.role}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Department
              </label>
              <p className="text-sm text-brand-primary-text bg-gray-900/5 rounded-lg px-3 py-2">
                {profile.department || 'No department assigned'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-brand-secondary-text">
              <p>Account Status: <span className="text-green-600 font-medium">Active</span></p>
              <p>Access Level: <span className="text-brand-primary-text font-medium">{profile.role}</span></p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}