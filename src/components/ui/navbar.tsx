'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { isAdminOrManager, getUserInitials, getUserRole } from '@/lib/utils'

export default function Navbar() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const userRole = getUserRole(session)
  const canManage = isAdminOrManager(session)
  const [showAdminDropdown, setShowAdminDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const adminDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setShowAdminDropdown(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
        document.body.style.overflow = 'unset'
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showMobileMenu])

  return (
    <nav className="bg-brand-dark-blue shadow-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button - moved to left */}
            <div className="md:hidden mr-3">
              <button
                onClick={() => {
                  const newShowMobileMenu = !showMobileMenu
                  setShowMobileMenu(newShowMobileMenu)
                  // Prevent body scroll when mobile menu is open
                  if (newShowMobileMenu) {
                    document.body.classList.add('overflow-hidden')
                  } else {
                    document.body.classList.remove('overflow-hidden')
                  }
                }}
                className="text-brand-secondary-text hover:bg-gray-800 p-2 rounded-md transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            <Link href="/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-brand-primary-text">LSVR Inventory</h1>
              </div>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-1">
              <Link 
                href="/dashboard" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Dashboard
              </Link>
              <Link 
                href="/assets" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Assets
              </Link>
              <Link 
                href="/asset-groups" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Asset Groups
              </Link>
              <Link 
                href="/presets" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Presets
              </Link>
              <Link 
                href="/transactions" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Transactions
              </Link>
              <Link 
                href="/maintenance" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Maintenance
              </Link>
              <Link 
                href="/reports" 
                className="text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Reports
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session && (
              <>
                {/* Admin/Manager Dropdown - Hidden on mobile */}
                {canManage && (
                  <div className="hidden md:block relative" ref={adminDropdownRef}>
                    <button
                      onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                      className="bg-brand-orange hover:bg-brand-orange-soft text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{userRole === 'ADMIN' ? 'Admin' : 'Manager'}</span>
                      <svg className={`w-4 h-4 transition-transform ${showAdminDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showAdminDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-brand-dark-blue rounded-md shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 dark:ring-opacity-30 z-50">
                        <div className="py-1">
                          {/* User Management Section - Admin Only */}
                          {(session.user as any)?.role === 'ADMIN' && (
                            <>
                              <div className="px-4 py-2 text-xs font-semibold text-brand-secondary-text uppercase tracking-wider border-b border-gray-700">
                                User Management
                              </div>
                              <Link
                                href="/admin/users"
                                onClick={() => setShowAdminDropdown(false)}
                                className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                                Manage Users
                              </Link>
                              <div className="border-t border-gray-700 my-1"></div>
                            </>
                          )}

                          {/* Asset Management Section */}
                          <div className="border-t border-gray-700 my-1"></div>
                          <div className="px-4 py-2 text-xs font-semibold text-brand-secondary-text uppercase tracking-wider border-b border-gray-700">
                            Asset Management
                          </div>
                          <Link
                            href="/clients"
                            onClick={() => setShowAdminDropdown(false)}
                            className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2M7 21h2m-2 0H3m2-8h12m-10 0v6m4-6v6m4-6v6" />
                            </svg>
                            Manage Clients
                          </Link>
                          <Link
                            href="/locations"
                            onClick={() => setShowAdminDropdown(false)}
                            className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Manage Locations
                          </Link>
                          <Link
                            href="/categories"
                            onClick={() => setShowAdminDropdown(false)}
                            className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Manage Categories
                          </Link>

                          {/* Profile Section */}
                          <div className="border-t border-gray-700 my-1"></div>
                          <Link
                            href="/profile"
                            onClick={() => setShowAdminDropdown(false)}
                            className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </Link>
                          <button
                            onClick={() => {
                              setShowAdminDropdown(false)
                              signOut({ callbackUrl: '/auth/signin' })
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>

                          {/* System Settings Section - Admin Only */}
                          {(session.user as any)?.role === 'ADMIN' && (
                            <>
                              <div className="border-t border-gray-700 my-1"></div>
                              <div className="px-4 py-2 text-xs font-semibold text-brand-secondary-text uppercase tracking-wider border-b border-gray-700">
                                System
                              </div>
                              <Link
                                href="/admin/settings"
                                onClick={() => setShowAdminDropdown(false)}
                                className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                </svg>
                                System Settings
                              </Link>
                              <Link
                                href="/api/health"
                                target="_blank"
                                onClick={() => setShowAdminDropdown(false)}
                                className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                System Health
                                <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* User dropdown for regular users - Hidden on mobile */}
                {!canManage && (
                  <div className="hidden md:block relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-2 text-sm text-brand-secondary-text hover:text-gray-700 dark:hover:text-brand-primary-text transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-orange to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {getUserInitials(session)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{session.user?.name || 'User'}</div>
                        <div className="text-xs text-brand-secondary-text">
                          {(session.user as any)?.role}
                        </div>
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-brand-dark-blue rounded-md shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 dark:ring-opacity-30 z-50">
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </Link>
                          <button
                            onClick={() => {
                              setShowUserDropdown(false)
                              signOut({ callbackUrl: '/auth/signin' })
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-brand-secondary-text hover:bg-gray-800 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Static user info for admins/managers (they use the admin dropdown) */}
                {canManage && (
                  <div className="hidden md:flex items-center space-x-2 text-sm text-brand-secondary-text">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-orange to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-xs">
                          {session.user?.name ? session.user.name.charAt(0).toUpperCase() : session.user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{session.user?.name || 'User'}</div>
                      <div className="text-xs text-brand-secondary-text">
                        {(session.user as any)?.role}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-50 bg-brand-dark-blue border-t border-gray-700 shadow-lg overflow-y-auto" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/assets"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Assets
            </Link>
            <Link
              href="/asset-groups"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Asset Groups
            </Link>
            <Link
              href="/presets"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Presets
            </Link>
            <Link
              href="/transactions"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Transactions
            </Link>
            <Link
              href="/maintenance"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Maintenance
            </Link>
            <Link
              href="/reports"
              onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
              className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Reports
            </Link>

            {/* Mobile Admin Menu */}
            {session && canManage && (
              <>
                <div className="border-t border-gray-700 mt-3 pt-3">
                  <div className="px-3 py-2 text-xs font-semibold text-brand-secondary-text uppercase tracking-wider">
                    {userRole === 'ADMIN' ? 'Admin' : 'Manager'} Menu
                  </div>

                  {/* User Management - Admin Only */}
                  {userRole === 'ADMIN' && (
                    <Link
                      href="/admin/users"
                      onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                      className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                    >
                      Manage Users
                    </Link>
                  )}

                  <Link
                    href="/clients"
                    onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                    className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Manage Clients
                  </Link>
                  <Link
                    href="/locations"
                    onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                    className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Manage Locations
                  </Link>
                  <Link
                    href="/categories"
                    onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                    className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Manage Categories
                  </Link>

                  {/* System Settings - Admin Only */}
                  {(session.user as any)?.role === 'ADMIN' && (
                    <>
                      <Link
                        href="/admin/settings"
                        onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                        className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                      >
                        System Settings
                      </Link>
                      <Link
                        href="/api/health"
                        target="_blank"
                        onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                        className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                      >
                        System Health
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Profile & Sign Out */}
            {session && (
              <div className="border-t border-gray-700 mt-3 pt-3">
                <Link
                  href="/profile"
                  onClick={() => {
                setShowMobileMenu(false)
                document.body.classList.remove('overflow-hidden')
              }}
                  className="block text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setShowMobileMenu(false)
                    document.body.classList.remove('overflow-hidden')
                    signOut({ callbackUrl: '/auth/signin' })
                  }}
                  className="block w-full text-left text-brand-secondary-text hover:bg-gray-800 px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Sign Out
                </button>

                {/* User info at the bottom - last item */}
                <div className="flex items-center space-x-3 px-3 py-2 mt-3 pt-3 border-t border-gray-700">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-orange to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {session.user?.name ? session.user.name.charAt(0).toUpperCase() : session.user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-brand-primary-text text-sm truncate">
                      {session.user?.name || 'User'}
                    </div>
                    <div className="text-xs text-brand-secondary-text">
                      {(session.user as any)?.role}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}