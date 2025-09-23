import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LSVR Inventory Management',
  description: 'Post-production inventory management system',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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