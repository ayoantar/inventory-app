'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { clientConfig } from '@/lib/client-config'

interface ClientThemeContextType {
  branding: typeof clientConfig.branding
  features: typeof clientConfig.features
}

const ClientThemeContext = createContext<ClientThemeContextType | null>(null)

export function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const { branding, features } = clientConfig

  useEffect(() => {
    // Apply CSS custom properties for client branding
    const root = document.documentElement
    
    root.style.setProperty('--client-primary-color', branding.primaryColor)
    root.style.setProperty('--client-secondary-color', branding.secondaryColor)
    
    // Update document title and favicon
    document.title = `${branding.companyName} - Inventory Management`
    
    if (branding.favicon) {
      const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (favicon) {
        favicon.href = branding.favicon
      }
    }
    
    // Add theme class to body
    document.body.className = `theme-${branding.theme}`
    
  }, [branding])

  return (
    <ClientThemeContext.Provider value={{ branding, features }}>
      {children}
    </ClientThemeContext.Provider>
  )
}

export function useClientTheme() {
  const context = useContext(ClientThemeContext)
  if (!context) {
    throw new Error('useClientTheme must be used within a ClientThemeProvider')
  }
  return context
}