import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LSVR Inventory Management',
  description: 'Post-production inventory management system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark bg-brand-dark-blue">
      <body className={`${inter.className} text-brand-primary-text bg-brand-dark-blue`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}