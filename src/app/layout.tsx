import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LSVR Inventory Management',
  description: 'Post-production inventory management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-brand-dark-blue text-gray-900 dark:text-brand-primary-text`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}