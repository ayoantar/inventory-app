'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/contexts/theme-context'
import { CartProvider } from '@/contexts/cart-context'

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