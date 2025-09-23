'use client'

import { SessionProvider } from 'next-auth/react'
import { CartProvider } from '@/contexts/cart-context'
import { ThemeProvider } from '@/hooks/useTheme'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}