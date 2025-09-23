'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import MobileNavigation from './MobileNavigation'

interface MobileHeaderProps {
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
}

export default function MobileHeader({
  title = 'LSVR Inventory',
  showBackButton = false,
  onBack,
  rightAction
}: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-brand-dark-blue/95 backdrop-blur-lg border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Side */}
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-orange to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            {rightAction}

            {/* User Avatar */}
            {session?.user && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}