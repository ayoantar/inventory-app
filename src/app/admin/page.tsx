'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function AdminRedirect() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.replace('/auth/signin')
      return
    }

    // Check if user has admin/manager privileges
    const userRole = (session.user as any)?.role
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      // Redirect to profile page where admin functions are now accessible via dropdown
      router.replace('/profile')
    } else {
      // Regular users go to dashboard
      router.replace('/dashboard')
    }
  }, [router, session, status])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/20 dark:from-brand-dark-blue dark:via-gray-925 dark:to-brand-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
        <p className="text-brand-primary-text">
          {status === 'loading' ? 'Loading...' : 'Redirecting...'}
        </p>
        <p className="text-sm text-gray-300 mt-2">
          Admin functions are now available in your profile
        </p>
      </div>
    </div>
  )
}