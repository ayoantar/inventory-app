'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/components/ui/navbar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return
    
    // Redirect to signin if not authenticated, except for public pages
    const publicPaths = ['/auth/signin', '/auth/signup', '/auth/forgot-password']
    if (status === 'unauthenticated' && !publicPaths.includes(pathname)) {
      router.push('/auth/signin')
    }
  }, [status, router, pathname])

  return (
    <div className="min-h-screen bg-gray-900/5">
      <Navbar />
      {children}
    </div>
  )
}