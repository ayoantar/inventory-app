'use client'

import { ReactNode } from 'react'
import MobileHeader from './MobileHeader'

interface MobileLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  rightAction?: ReactNode
}

export default function MobileLayout({
  children,
  title,
  showBackButton = false,
  onBack,
  rightAction
}: MobileLayoutProps) {
  return (
    <div className="md:hidden min-h-screen bg-gray-100 dark:bg-gray-800">
      <MobileHeader
        title={title}
        showBackButton={showBackButton}
        onBack={onBack}
        rightAction={rightAction}
      />

      <main className="pb-safe">
        <div className="px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}