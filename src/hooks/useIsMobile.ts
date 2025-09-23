'use client'

import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [breakpoint])

  return isMobile
}

export function useIsTablet(breakpoint: number = 1024): boolean {
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= 768 && width < breakpoint)
    }

    checkIsTablet()
    window.addEventListener('resize', checkIsTablet)

    return () => window.removeEventListener('resize', checkIsTablet)
  }, [breakpoint])

  return isTablet
}